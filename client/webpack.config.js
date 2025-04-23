// webpack.config.js
module.exports = {
  // …
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
        exclude: [
          /node_modules\/react-datepicker/    // ← don’t try to load source maps for react‑datepicker
        ],
      },
      // … your other rules
    ],
  },
};

// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.use && rule.use.loader === "source-map-loader") {
          rule.exclude = /node_modules\/react-datepicker/;
        }
      });
      return webpackConfig;
    },
  },
};
