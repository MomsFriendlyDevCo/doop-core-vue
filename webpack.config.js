/**
* Generic webpack payload used by the frontend compiler
*
* @param {string} app.config.paths.root Root path when generating or reading files
*
* @param {boolean} [app.config.isProduction=false] Tweaks various performance related options to optimal if true
*
* @param {object} app.config.hmr Various Hot-Module-Reload related options
* @param {boolean} [app.config.hmr.enabled=false] Whether to enable all features of HMR
* @param {boolean} [app.config.hmr.frontend=false] Whether to enable front-end hot reloading
* @param {boolean} [app.config.hmr.backend=false] Whether to enable back-end hot reloading
*
* @param {object} app.config.build Various build related options
* @param {boolean} [app.config.build.minimize] Whether to attempt to minify the build, defaults to the value of `app.config.isProduction` if omitted
* @param {boolean} [app.config.build.watchNodeModules=false] Whether to include `node_modules` contents as build targets, if disabled files here are consided immutable and are cached onwards after the first read
*/

var { VueLoaderPlugin } = require('vue-loader');
var { CleanWebpackPlugin } = require('clean-webpack-plugin');
var LodashPlugin = require('lodash-webpack-plugin');
var glob = require('globby');
var fspath = require('path');
var webpack = require('webpack');

if (!global.app) throw new Error('Cant find `app` global - run this compiler within a Doop project only');
if (!Object.prototype.hasOwnProperty.call(global.app.config, 'hmr')) console.warn('[WARN] Missing app.config.hmr configuration');
if (!Object.prototype.hasOwnProperty.call(global.app.config, 'build')) console.warn('[WARN] Missing app.config.build configuration');
if (!Object.prototype.hasOwnProperty.call(global.app.config, 'layout') || typeof global.app.config.layout?.$config != 'function') console.warn('[WARN] Missing app.config.layout.$config function exporter');

module.exports = {
	mode: app.config.isProduction ? 'production' : 'development',
	entry: ()=> {
		// Find all project level .vue files
		var vueLocal = glob.sync([
			// NOTE: Globby flakes out on Windows if we prefix with app.config.paths.root - https://github.com/sindresorhus/globby/issues/155
			'./app/app.frontend.vue', // Main app frontend loader (must be first)
			'./**/*.vue', // All application .vue files
		], {
			gitignore: true, // Respect .gitignore file (usually excludes node_modules, data, test etc.)
		});

		// Find @doop/**/*.vue files (seperate so gitignore doesn't trigger)
		var vueImport = glob.sync([
			'./node_modules/@doop/**/*.vue', // All 3rd party .vue files
		]);

		console.log('Imported', vueLocal.length, 'local .vue files')
		console.log('Imported', vueImport.length, '3rd party .vue files');

		return [
			...vueLocal.map(path => `./${path}`), // Webpack is really fussy about relative paths
			...vueImport.map(path => `./${path}`),

			// Include Webpack middlewhere when not in production to hot reload components
			...(!app.config.isProduction && app.config?.hmr?.enabled && app.config?.hmr?.frontend ? ['webpack-hot-middleware/client?path=/dist/hmr'] : []),
		];
	},
	output: {
		globalObject: 'this',
		libraryTarget: 'umd',
		path: `${app.config.paths.root}/dist`,
		filename: 'app.[name].js',
	},
	optimization: {
		minimize: app.config.build.minimize ?? app.config.isProduction,
	},
	cache: {
		type: 'filesystem',
		cacheDirectory: `${app.config.paths.root}/.cache`,
	},
	module: {
		rules: [
			...(!app.config.isProduction ? [{
				test: /\.js$/,
				enforce: 'pre',
				loader: require.resolve('source-map-loader'),
			}] : []),
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: require.resolve('babel-loader'),
			},
			{
				test: /\.vue$/,
				use: [
					{
						loader: require.resolve('vue-loader'),
						options: {
							compiler: require('vue-template-babel-compiler'),
						},
					},
					require.resolve('./fixes/doop-loader'),
				],
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
		],
	},
	plugins: [
		new webpack.DefinePlugin({
			CONFIG: JSON.stringify(app.config.layout.$config(app)), // Ask app.config.layout.$config(app) to expose config object + JSON it
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
	snapshot: {
		...((app.config.build?.watchNodeModules ?? false)
			? {managedPaths: []}
			: {}
		),
	},

	// Source-map inclusion error surpression (non production only)
	...(!app.config.isProduction ? {
		ignoreWarnings: [/Failed to parse source map/],
	} : {
		devtool: false, // Disable in production
	}),
};
