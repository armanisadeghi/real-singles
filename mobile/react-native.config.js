/**
 * Prevent autolinking of modules that we only need for JS-level tooling.
 * `react-native-worklets` provides the Babel plugin required by nativewind,
 * but React Native already ships the native runtime via Reanimated.
 * Disabling the native integration avoids duplicate symbol errors on Android.
 */
module.exports = {
  dependencies: {
    'react-native-worklets': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};

