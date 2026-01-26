#!/usr/bin/env node
/**
 * Preflight check script for mobile development
 * Catches common issues before wasting time on builds
 * 
 * Run with: node scripts/preflight.js
 * Or automatically via: pnpm dev:android / pnpm dev:ios
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(msg) {
  console.log(msg);
}

function success(msg) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function warn(msg) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function error(msg) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function header(msg) {
  console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`);
}

let hasErrors = false;
let hasWarnings = false;

// ============================================================================
// Check 1: node_modules in sync with lockfile
// ============================================================================
header('Checking dependencies...');

function checkDependenciesSync() {
  const lockfilePath = path.join(__dirname, '..', 'pnpm-lock.yaml');
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  const nodeModulesMetaPath = path.join(nodeModulesPath, '.modules.yaml');

  // Check if node_modules exists
  if (!fs.existsSync(nodeModulesPath)) {
    error('node_modules not found! Run: pnpm install');
    hasErrors = true;
    return;
  }

  // Check if lockfile exists
  if (!fs.existsSync(lockfilePath)) {
    error('pnpm-lock.yaml not found!');
    hasErrors = true;
    return;
  }

  // Compare modification times
  const lockfileStat = fs.statSync(lockfilePath);
  const nodeModulesStat = fs.existsSync(nodeModulesMetaPath) 
    ? fs.statSync(nodeModulesMetaPath)
    : fs.statSync(nodeModulesPath);

  if (lockfileStat.mtime > nodeModulesStat.mtime) {
    warn('Lockfile is newer than node_modules - dependencies may be out of sync');
    warn('Recommendation: Run "pnpm install" before building');
    hasWarnings = true;
    return;
  }

  // Quick sanity check: verify a few key expo packages exist
  const criticalPackages = [
    'expo',
    'expo-router',
    'react-native',
  ];

  for (const pkg of criticalPackages) {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (!fs.existsSync(pkgPath)) {
      error(`Critical package missing: ${pkg}`);
      error('Run: pnpm install');
      hasErrors = true;
      return;
    }
  }

  // Check for any imports in the codebase that reference missing packages
  // This is a lightweight check - just look for expo-* imports in package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  for (const dep of Object.keys(allDeps)) {
    if (dep.startsWith('expo-') || dep.startsWith('react-native')) {
      const depPath = path.join(nodeModulesPath, dep);
      if (!fs.existsSync(depPath)) {
        error(`Package in package.json but not installed: ${dep}`);
        error('Run: pnpm install');
        hasErrors = true;
        return;
      }
    }
  }

  success('Dependencies appear to be in sync');
}

checkDependenciesSync();

// ============================================================================
// Check 2: ADB connection (Android only)
// ============================================================================
const isAndroid = process.argv.includes('--android') || process.argv.includes('-a');
const isIOS = process.argv.includes('--ios') || process.argv.includes('-i');

if (isAndroid) {
  header('Checking Android environment...');

  function checkAdb() {
    try {
      const result = spawnSync('adb', ['devices'], { encoding: 'utf8', timeout: 5000 });
      
      if (result.error) {
        warn('ADB not found or not responding');
        warn('Make sure Android SDK platform-tools is in your PATH');
        hasWarnings = true;
        return;
      }

      const output = result.stdout || '';
      const lines = output.split('\n').filter(line => line.trim() && !line.includes('List of devices'));
      
      if (lines.length === 0) {
        warn('No Android devices/emulators connected');
        warn('Start an emulator or connect a device before building');
        hasWarnings = true;
        return;
      }

      const connectedDevices = lines.filter(line => line.includes('device') && !line.includes('offline'));
      const offlineDevices = lines.filter(line => line.includes('offline'));

      if (offlineDevices.length > 0) {
        warn(`${offlineDevices.length} device(s) offline - may need to restart ADB`);
        warn('Try: adb kill-server && adb start-server');
        hasWarnings = true;
      }

      if (connectedDevices.length > 0) {
        success(`${connectedDevices.length} Android device(s) connected`);
      } else {
        warn('No Android devices ready');
        hasWarnings = true;
      }
    } catch (e) {
      warn('Could not check ADB status: ' + e.message);
      hasWarnings = true;
    }
  }

  // WSL2-specific check
  function checkWslAdb() {
    const isWsl = process.platform === 'linux' && fs.existsSync('/proc/version');
    if (isWsl) {
      try {
        const procVersion = fs.readFileSync('/proc/version', 'utf8');
        if (procVersion.toLowerCase().includes('microsoft') || procVersion.toLowerCase().includes('wsl')) {
          warn('Running in WSL2 - ADB connections to Windows emulators can be unstable');
          warn('Tip: Keep the emulator visible/focused during builds to prevent disconnection');
          warn('Tip: Consider using a physical device connected via USB for more reliability');
          hasWarnings = true;
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  checkWslAdb();
  checkAdb();
}

// ============================================================================
// Check 3: iOS environment (iOS only)
// ============================================================================
if (isIOS) {
  header('Checking iOS environment...');

  if (process.platform !== 'darwin') {
    error('iOS builds require macOS');
    hasErrors = true;
  } else {
    // Check for Xcode
    try {
      execSync('xcode-select -p', { encoding: 'utf8', stdio: 'pipe' });
      success('Xcode command line tools found');
    } catch (e) {
      error('Xcode command line tools not found');
      error('Run: xcode-select --install');
      hasErrors = true;
    }

    // Check for CocoaPods
    try {
      execSync('pod --version', { encoding: 'utf8', stdio: 'pipe' });
      success('CocoaPods found');
    } catch (e) {
      warn('CocoaPods not found - may be needed for native builds');
      hasWarnings = true;
    }
  }
}

// ============================================================================
// Summary
// ============================================================================
console.log('');
if (hasErrors) {
  console.log(`${colors.red}${colors.bold}Preflight failed!${colors.reset} Fix the errors above before building.`);
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${colors.yellow}${colors.bold}Preflight passed with warnings.${colors.reset} Build may still work.`);
  console.log('');
} else {
  console.log(`${colors.green}${colors.bold}All checks passed!${colors.reset}`);
  console.log('');
}
