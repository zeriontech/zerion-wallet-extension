module.exports = {
  presets: ["@babel/typescript", "@babel/react"],
  env: {
    development: {
      plugins: ["react-refresh/babel"],
    },
  },
};
