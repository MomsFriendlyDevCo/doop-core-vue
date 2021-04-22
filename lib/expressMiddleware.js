var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var webpackConfig = require(`${app.config.paths.root}/node_modules/@doop/core-vue/webpack.config`);
var compiler = webpack(webpackConfig);

/**
* Installs webpack as a compile-on-demand service
* This bypasses the need to call `gulp build.vue` before each run cycle
*/
if (!global.app) throw new Error('Cant find `app` global - run this middleware within a Doop project only');

app.on('preMiddleware', ()=> {
	app.log.as('HMR', 'Hot module reload enabled');

	// Server side middleware - handles recompile on any changes
	app.use(webpackDevMiddleware(compiler, {
		publicPath: '/dist/',
		writeToDisk: true,
		stats: {
			colors: true
		},
	}));

	app.use(webpackHotMiddleware(compiler, {
		log: console.log,
		path: '/dist/hmr',
		heartbeat: 10 * 1000
	}));
});
