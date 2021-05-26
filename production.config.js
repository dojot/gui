const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
    mode: 'none', // @TODO set to production
    entry: {
        devices: './src/js/index.js',
    },
    output: {
        publicPath: JSON.stringify(process.env.APPLICATION_URL),
        filename: 'js/[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                loader: require.resolve('babel-loader'),
                options: {
                    // This is a feature of `babel-loader` for webpack (not Babel itself).
                    // It enables caching results in ./node_modules/.cache/babel-loader/
                    // directory for faster rebuilds.
                    cacheDirectory: true,
                    plugins: ['react-hot-loader/babel'],
                },
                exclude: /(node_modules|src\/components)/,
            },
            {
                test: /\.(css|scss)$/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader', options: { sourceMap: false, url: false } },
                    { loader: 'sass-loader', options: { sourceMap: false, url: false } },
                ],
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file-loader',
                options: { mimetype: 'image/svg+xml' },
            },
            {
                test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file-loader',
                options: { mimetype: 'application/font-woff' },
            },
            {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file-loader',
                options: { mimetype: 'application/font-woff' },
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file-loader',
                options: { mimetype: 'application/octet-stream' },
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file-loader',
            },
        ],
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: 'src/html/index.html', to: 'index.html' },
            { from: 'src/js/views/flows/vendor.js', to: 'js/vendor.js' },
            { from: 'node_modules/leaflet/dist/leaflet.css', to: 'leaflet.css' },
            { from: 'node_modules/leaflet/dist/images', to: 'images' },
            { from: 'node_modules/ace-builds/src-min', to: 'js/ace' },
            {
                from: 'node_modules/materialize-css/dist/js/materialize.min.js',
                to: 'js/materialize.js',
            },
            { from: 'node_modules/materialize-css/dist/fonts', to: 'fonts' },
            { from: 'node_modules/jquery/dist/jquery.min.js', to: 'js/jquery.js' },
            {
                from: 'node_modules/jquery-ui-dist/jquery-ui.min.js',
                to: 'js/jquery.ui.js',
            },
            {
                from: 'node_modules/jquery-i18next/jquery-i18next.min.js',
                to: 'js/jquery-i18next.min.js',
            },
            {
                from: 'node_modules/i18next-xhr-backend/i18nextXHRBackend.min.js',
                to: 'js/i18nextXHRBackend.min.js',
            },
            { from: 'node_modules/i18next/i18next.min.js', to: 'js/i18next.min.js' },
            { from: 'src/img', to: 'images', force: true },
        ]),

        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production'),
                GUI_VERSION: JSON.stringify(process.env.GUI_VERSION),
                BASE_URL: JSON.stringify(process.env.BASE_URL),
                APPLICATION_URL: JSON.stringify(process.env.APPLICATION_URL),
            },
        }),
    ],
    resolve: {
        alias: {
            Components: path.resolve(__dirname, 'src/js/components'),
            Comms: path.resolve(__dirname, 'src/js/comms'),
            Actions: path.resolve(__dirname, 'src/js/actions'),
            Stores: path.resolve(__dirname, 'src/js/stores'),
            Views: path.resolve(__dirname, 'src/js/views'),
            Containers: path.resolve(__dirname, 'src/js/containers'),
            Src: path.resolve(__dirname, 'src/js'),
        },
    },
};
