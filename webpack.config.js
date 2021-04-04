/**
* Generic webpack payload used by the frontend compiler
*/

var { VueLoaderPlugin } = require('vue-loader');
var { CleanWebpackPlugin } = require('clean-webpack-plugin');
var LodashPlugin = require('lodash-webpack-plugin');
var webpack = require('webpack');
var fspath = require('path');

module.exports = {
	mode: app.config.isProduction ? 'production' : 'development',
	entry: {
		setup: './frontend.doop.setup.js',
		main: './frontend.doop.vue.js',
	},
	output: {
		globalObject: 'this',
		libraryTarget: 'umd',
		path: `${app.config.paths.root}/dist`,
		filename: 'app.[name].js',
	},
	cache: {
		type: 'filesystem',
		cacheDirectory: `${app.config.paths.root}/.cache`,
	},
	module: {
		rules: [
			// FIXME: Loader does not export
			{
				test: require.resolve('./node_modules/@momsfriendlydevco/loader/dist/loader.js'),
				loader: 'exports-loader',
				options: {
					exports: 'default Loader',
				},
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
			},
			{
				test: /\.vue$/,
				use: [
					'vue-loader',
					'./build/vue-loader-noexport.js',
				]
			},
			{
				test: /\.(sa|sc|c)ss$/,
				use: [
					'vue-style-loader',
					'css-loader',
					'sass-loader',
				]
			},
			{
				test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: 'fonts/'
						}
					}
				]
			},
			/*
			// As per https://www.npmjs.com/package/font-awesome-sass-loader
			// FIXME: Uncaught Error: Cannot find module '../node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2'
			// the url-loader uses DataUrls.
			{
				test: /\.woff(2)?(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'url-loader',
						options: {
							limit: 10000,
							mimetype: 'application/font-woff'
						}
					}
				]
			},
			// the file-loader emits files.
			{
				test: /\.(ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: 'fonts/'
						}
					}
				]
			},
			*/
		],
	},
	plugins: [
		// TODO: popper.js
		new webpack.DefinePlugin({
			CONFIG: JSON.stringify(app.config),
		}),
		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery',
			moment: 'moment',
			TreeTools: 'tree-tools',
		}),
		new VueLoaderPlugin(),
		new CleanWebpackPlugin(),
		new LodashPlugin(),

		/* FIXME: Does this help in any way?
		new webpack.DllPlugin({
			path: fspath.join(__dirname, 'dist', '[name]-manifest.json'),
			name: '[name]_[fullhash]',
		})
		*/


		new webpack.AutomaticPrefetchPlugin(),
		new webpack.ProgressPlugin({
			activeModules: true,
			entries: true,
			modules: true,
			profile: false,
			dependencies: true,
		}),
	],
	resolve: {
		extensions: ['.js', '.vue'],
	},
};
