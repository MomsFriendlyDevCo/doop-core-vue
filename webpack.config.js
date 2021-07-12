/**
* Generic webpack payload used by the frontend compiler
*/

var { VueLoaderPlugin } = require('vue-loader');
var { CleanWebpackPlugin } = require('clean-webpack-plugin');
var LodashPlugin = require('lodash-webpack-plugin');
var glob = require('globby');
var fspath = require('path');
var webpack = require('webpack');

if (!global.app) throw new Error('Cant find `app` global - run this compiler within a Doop project only');
if (!Object.prototype.hasOwnProperty.call(global.app.config, 'hmr')) console.warn('[WARN] Missing HMR configuration');

module.exports = {
	mode: app.config.isProduction ? 'production' : 'development',
	entry: [
		// Include all .vue files
		...[
			// Slurp all project level .vue files
			glob.sync([
				`${app.config.paths.root}/app/app.frontend.vue`, // Main app frontend loader (must be first)
				`${app.config.paths.root}/**/*.vue`, // All application .vue files
			], {
				gitignore: true, // Respect .gitignore file (usually excludes node_modules, data, test etc.)
			}),

			// Slurp @doop/**/*.vue files (seperate so gitignore doesn't trigger)
			glob.sync([
				`${app.config.paths.root}/**/node_modules/@doop/**/*.vue`, // All application .vue files
			]),
		].flat(),

		// Include Webpack middlewhere when not in production to hot reload components
		...(!app.config.isProduction && app.config?.hmr?.enabled && app.config?.hmr?.frontend ? ['webpack-hot-middleware/client?path=/dist/hmr'] : []),
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
					{
						loader: require.resolve('sass-loader'),
						options: {
						  sassOptions: {
							indentWidth: 4,
							includePaths: [
								fspath.resolve(__dirname, './node_modules'),
								fspath.resolve('./node_modules'),
							],
						  },
						},
					},
				]
			},
			{
				test: /\.jpe?g$|\.gif$|\.png$/i,
				use: [
					{
						loader: require.resolve('file-loader'),
						options: {
							name: '[name].[ext]',
							outputPath: 'images/'
						}
					}
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
		...(!app.config.isProduction && app.config?.hmr?.enabled && app.config?.hmr?.frontend ? [new webpack.HotModuleReplacementPlugin()] : []),
		new webpack.AutomaticPrefetchPlugin(),
		new webpack.ProgressPlugin({
			activeModules: false,
			entries: true,
			modules: true,
			profile: false,
			dependencies: false,
		}),
	],
	resolve: {
		extensions: ['.js', '.mjs', '.vue'],
	},
};
