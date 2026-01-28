/**
 * Create Dark Mode Logo
 *
 * Converts black pixels in a PNG to white while preserving other colors (like the orange checkmark).
 * Useful for creating dark mode variants of logos.
 *
 * Usage:
 *   pnpm tsx scripts/create-dark-mode-logo.ts
 *
 * Or with custom input/output:
 *   pnpm tsx scripts/create-dark-mode-logo.ts --input ../mobile/assets/images/logo.png --output ../mobile/assets/images/logo-dark.png
 */

import sharp from "sharp";
import { resolve, dirname, basename, extname, join } from "path";

// Default paths
const DEFAULT_INPUT = resolve(__dirname, "../../mobile/assets/images/logo.png");
const DEFAULT_OUTPUT_SUFFIX = "-dark";

// Color detection thresholds
const BLACK_THRESHOLD = 80; // Pixels with R, G, B all below this are considered "black"
const ORANGE_MIN_R = 150; // Orange pixels have high red
const ORANGE_MAX_B = 100; // Orange pixels have low blue

interface PixelStats {
  total: number;
  transparent: number;
  black: number;
  orange: number;
  other: number;
  converted: number;
}

function parseArgs(): { input: string; output: string } {
  const args = process.argv.slice(2);
  let input = DEFAULT_INPUT;
  let output = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) {
      input = resolve(process.cwd(), args[i + 1]);
      i++;
    } else if (args[i] === "--output" && args[i + 1]) {
      output = resolve(process.cwd(), args[i + 1]);
      i++;
    }
  }

  // Generate default output path if not specified
  if (!output) {
    const dir = dirname(input);
    const ext = extname(input);
    const name = basename(input, ext);
    output = join(dir, `${name}${DEFAULT_OUTPUT_SUFFIX}${ext}`);
  }

  return { input, output };
}

function isBlackish(r: number, g: number, b: number): boolean {
  // Check if pixel is dark/black (not orange)
  const isOrange = r > ORANGE_MIN_R && b < ORANGE_MAX_B && g > b;
  const isDark = r < BLACK_THRESHOLD && g < BLACK_THRESHOLD && b < BLACK_THRESHOLD;

  return isDark && !isOrange;
}

function isOrangeish(r: number, g: number, b: number): boolean {
  // Orange/gold colors: high red, medium green, low blue
  return r > ORANGE_MIN_R && b < ORANGE_MAX_B && g > b;
}

async function createDarkModeLogo(inputPath: string, outputPath: string): Promise<void> {
  console.log("🎨 Creating dark mode logo...\n");
  console.log(`  Input:  ${inputPath}`);
  console.log(`  Output: ${outputPath}\n`);

  // Read the image
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  console.log(`  Dimensions: ${metadata.width}x${metadata.height}`);
  console.log(`  Format: ${metadata.format}`);
  console.log(`  Channels: ${metadata.channels}\n`);

  // Get raw pixel data (ensure RGBA)
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const stats: PixelStats = {
    total: info.width * info.height,
    transparent: 0,
    black: 0,
    orange: 0,
    other: 0,
    converted: 0,
  };

  // Process each pixel (RGBA = 4 bytes per pixel)
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    // Skip fully transparent pixels
    if (a === 0) {
      stats.transparent++;
      continue;
    }

    // Check if this is a black/dark pixel
    if (isBlackish(r, g, b)) {
      stats.black++;
      // Convert to white
      pixels[i] = 255; // R
      pixels[i + 1] = 255; // G
      pixels[i + 2] = 255; // B
      // Keep alpha as-is
      stats.converted++;
    } else if (isOrangeish(r, g, b)) {
      stats.orange++;
    } else {
      stats.other++;
    }
  }

  // Create output image
  await sharp(Buffer.from(pixels), {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputPath);

  // Print stats
  console.log("📊 Processing Stats:");
  console.log(`  Total pixels:      ${stats.total.toLocaleString()}`);
  console.log(`  Transparent:       ${stats.transparent.toLocaleString()}`);
  console.log(`  Black (converted): ${stats.converted.toLocaleString()}`);
  console.log(`  Orange (kept):     ${stats.orange.toLocaleString()}`);
  console.log(`  Other (kept):      ${stats.other.toLocaleString()}`);
  console.log("");
  console.log(`✅ Dark mode logo created: ${outputPath}`);
}

// Run
const { input, output } = parseArgs();

createDarkModeLogo(input, output).catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
