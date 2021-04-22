/**
* Generic webpack payload used by the frontend compiler
*/

var { VueLoaderPlugin } = require('vue-loader');
var { CleanWebpackPlugin } = require('clean-webpack-plugin');
var LodashPlugin = require('lodash-webpack-plugin');
var webpack = require('webpack');
var fspath = require('path');

if (!global.app) throw new Error('Cant find `app` global - run this compiler within a Doop project only');

module.exports = {
	mode: app.config.isProduction ? 'production' : 'development',
	entry: [
		`${app.config.paths.root}/frontend.doop.vue.js`,
		...(app.config.isProduction ? [] : ['webpack-hot-middleware/client?path=/dist/hmr']),
	],
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
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: require.resolve('babel-loader'),
			},
			{
				test: /\.vue$/,
				use: [
					require.resolve('vue-loader'),
					require.resolve('./fixes/doop-loader'),
				]
			},
			{
				test: /\.(sa|sc|c)ss$/,
				use: [
					require.resolve('vue-style-loader'),
					require.resolve('css-loader'),
					require.resolve('sass-loader'),
				]
			},
			{
				test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: require.resolve('file-loader'),
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
		new CleanWebpackPlugin({
			cleanOnceBeforeBuildPatterns: [ // Dont touch files generated by external processes
				'!docs',
			],
		}),
		new LodashPlugin(),
		...(app.config.isProduction ? [] : [new webpack.HotModuleReplacementPlugin()]),
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
