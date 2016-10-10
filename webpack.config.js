var path = require('path');
var webpack = require('webpack');
var loaders = require('./config/webpack.loaders.js');
var plugins = [];

if(process.env.NODE_ENV === 'production') {
    console.log('==> Production build');
    plugins.push(new webpack.DefinePlugin({
        "process.env": {
            NODE_ENV: JSON.stringify("production"),
        },
    }));
}

module.exports = {
  plugins: plugins,
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'pvw-presenter.js',
  },
  module: {
        preLoaders: [{
            test: /\.js$/,
            loader: "eslint-loader",
            exclude: /node_modules/,
        }],
        loaders: [
            { test: require.resolve("./src/index.js"), loader: "expose?Presenter" },
        ].concat(loaders),
    },
    resolve: {
        alias: {
            PVWStyle: path.resolve('./node_modules/paraviewweb/style'),
        },
    },
    postcss: [
        require('autoprefixer')({ browsers: ['last 2 versions'] }),
    ],
    eslint: {
        configFile: '.eslintrc.js',
    },
    devServer: {
        contentBase: './dist/',
        port: 9999,
        hot: true,
        quiet: false,
        noInfo: false,
        stats: {
            colors: true,
        },
        proxy: {},
    },
    externals: {
      three: 'THREE',
    },
};
