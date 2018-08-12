var CopyWebpackPlugin = require('copy-webpack-plugin');
var webpack = require('webpack');
var path = require('path');
// const HtmlWebpackPlugin = require("html-webpack-plugin");

function getEntrySources(sources) {
  if (process.env.NODE_ENV !== 'production') {
    sources.push('webpack-dev-server/client?http://localhost:8888');
    sources.push('webpack/hot/only-dev-server');
  }

  return sources;
}

module.exports = {
  mode: "none",
  entry: {
    devices: getEntrySources(["./src/js/index.js"])
  },
  output: {
    publicPath: "http://localhost:8888/",
    filename: "js/[name].js",
    path: path.resolve(__dirname, "dist")
  },
  devServer: {
    port: 8888,
    host: "0.0.0.0",
    disableHostCheck: true,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    publicPath: "http://localhost:8888/"
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: require.resolve("babel-loader"),
        options: {
          // This is a feature of `babel-loader` for webpack (not Babel itself).
          // It enables caching results in ./node_modules/.cache/babel-loader/
          // directory for faster rebuilds.
          cacheDirectory: true,
          plugins: ["react-hot-loader/babel"]
        },
        exclude: /(node_modules|src\/components)/
      },
      {
        test: /\.(css|scss)$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader", options: { sourceMap: false, url: false } },
          { loader: "sass-loader", options: { sourceMap: false, url: false } }
        ]
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader",
        options: { mimetype: "image/svg+xml" }
      },
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader",
        options: { mimetype: "application/font-woff" }
      },
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader",
        options: { mimetype: "application/font-woff" }
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader",
        options: { mimetype: "application/octet-stream" }
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader"
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: "src/html/index.html", to: "index.html" },
      { from: "src/js/views/flows/vendor.js", to: "js/vendor.js" },
      { from: "src/js/polyfills/localStorage.js", to: "js/localStorage.js" },
      { from: "node_modules/leaflet/dist/leaflet.css", to: "leaflet.css" },
      { from: "node_modules/leaflet/dist/images", to: "images" },
      { from: 'node_modules/ace-builds/src-min', to: 'js/ace' },
      {
        from: "node_modules/materialize-css/dist/js/materialize.min.js",
        to: "js/materialize.js"
      },
      { from: "node_modules/jquery/dist/jquery.min.js", to: "js/jquery.js" },
      {
        from: "node_modules/jquery-i18next/jquery-i18next.min.js",
        to: "js/jquery-i18next.min.js"
      },
      { from: 'node_modules/jquery-ui-dist/jquery-ui.min.js', to: 'js/jquery.ui.js' },
      {
        from: "node_modules/i18next-xhr-backend/i18nextXHRBackend.min.js",
        to: "js/i18nextXHRBackend.min.js"
      },
      { from: "node_modules/i18next/i18next.min.js", to: "js/i18next.min.js" },

      { from: "src/img", to: "images" },
      { from: "src/fonts", to: "fonts" }
        
    ]),

    new webpack.DefinePlugin({
      "process.env": {
        MAP_HAS_OVERLAY_ENV: "false",
        MAP_OVERLAY_JSON_ENV:
          '{path:"images/Layers/Combined.png",corner1:{lat:-20.90974,lng:-48.83651},corner2:{lat:-21.80963,lng:-47.11802},}'
      }
    })
  ]
};
