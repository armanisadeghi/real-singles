/**
 * React Native CLI configuration.
 * 
 * =============================================================================
 * ⚠️  CRITICAL: DO NOT DISABLE react-native-worklets NATIVE LINKING ⚠️
 * =============================================================================
 * 
 * react-native-reanimated v4 requires react-native-worklets for its native
 * worklets runtime (RNWorklets pod). Both packages must be installed and
 * native linking must NOT be disabled.
 * 
 * If you add this configuration, iOS builds will FAIL with:
 *   "Unable to find a specification for `RNWorklets` depended upon by `RNReanimated`"
 * 
 * ❌ DO NOT ADD THIS:
 *   'react-native-worklets': {
 *     platforms: { android: null, ios: null }
 *   }
 * 
 * This was previously used as a workaround for reanimated v3, but v4 changed
 * the architecture and now depends on the external worklets package.
 * 
 * =============================================================================
 */
module.exports = {
  dependencies: {
    // All dependencies autolinked by default
    // DO NOT disable native linking for react-native-worklets
  },
};

