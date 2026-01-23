module.exports = function (api) {
    api.cache(true);
    return {
      presets: [
        ["babel-preset-expo", { jsxImportSource: "nativewind" }],
        "nativewind/babel",
      ],
      plugins: [
        'react-native-reanimated/plugin',
          //  [
          //    "module-resolver",
          //     {
          //       alias: {
          //         "@": "./",  // 👈 This makes @ point to the root folder
          //       },
          //     },
          //  ],
          [
            "module-resolver",
            {
              alias: {
                "@": "./",  // 👈 points to project root
              },
              extensions: [".js", ".jsx", ".ts", ".tsx", ".json"]
            },
          ],
      ]
    };
  };