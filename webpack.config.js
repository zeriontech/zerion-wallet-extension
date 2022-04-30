const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const env = process.env.NODE_ENV || "development";
const isDevelopment = env === "development";
const isProduction = env === "production";

const fromRoot = (str) => path.join(__dirname, str);

const outpuDir = fromRoot("./dist");

module.exports = {
  mode: env,

  stats: isDevelopment ? "minimal" : undefined,
  devtool: isProduction ? false : "eval-source-map",
  watchOptions: {
    ignored: /node_modules/,
  },

  resolve: {
    // plugins: [new TSConfigPathsPlugin()],
    extensions: [".js", ".ts", ".tsx"],
  },

  entry: {
    background: fromRoot("./src/background/index.ts"),
    "content-script": fromRoot("./src/content-script/index.ts"),
    inPage: fromRoot("./src/content-script/in-page.ts"),
    ui: fromRoot("./src/ui/index.tsx"),
  },
  output: {
    path: outpuDir,
    filename: "[name].js",
    publicPath: "/",
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,

        oneOf: [
          {
            // make webpack include this file if it's not imported from entries
            sideEffects: true,
            test: /in-page\.ts$/,
            loader: "babel-loader",
          },
          { loader: "babel-loader" },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(env),
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: fromRoot("public"), to: outpuDir }],
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: fromRoot("./src/ui/popup.html"),
      chunks: ["ui"],
      filename: "popup.html",
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: fromRoot("./src/ui/dialog.html"),
      chunks: ["ui"],
      filename: "dialog.html",
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: fromRoot("./src/ui/index.html"),
      chunks: ["ui"],
      filename: "index.html",
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: fromRoot("./src/background/background.html"),
      chunks: ["background"],
      filename: "background.html",
    }),
  ],
};
