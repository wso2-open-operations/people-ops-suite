const path = require("path");
module.exports = function override(config) {
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.alias,
      "@config": path.resolve(__dirname, "src/config"),
      "@components": path.resolve(__dirname, "src/components"),
      "@app": path.resolve(__dirname, "src/app"),
      "@views": path.resolve(__dirname, "src/views"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@context": path.resolve(__dirname, "src/context"),
      "@slices": path.resolve(__dirname, "src/slices"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@src": path.resolve(__dirname, "src/"),
    },
  };
  return config;
};
