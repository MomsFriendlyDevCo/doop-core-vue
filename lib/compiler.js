var _ = require('lodash');
var webpack = require('webpack');

var wpCompiler; // Cached Webpack compiler if setings.cacheCompiler is truthy
var wpCompilerBusy = false; // Whether the compiler is currently working

/**
* Webpack frontend compiler for Doop@3 + Vue
*
* @type {function}
* @param {Object} [options] Additional options when compiling
* @param {boolean} [options.once=false] Run the compiler loop once, if falsy a watcher is setup and the process never terminates
* @param {Object} [options.config] Config object to use, defaults to the base node_modules/@doop/core-vue/webpack.config.js
* @param {Object} [options.configMerge] Additional config options to merge into the base config using _.merge()
* @param {function} [options.log=console.log] Logging function for output status messages
* @param {boolean} [options.colors=true] Whether to enable color output
* @returns {Promise} A promise which will resolve when the compile process has completed
*/
module.exports = function DoopFrontendVue(options) {
	if (!global.app) throw new Error('Cant find `app` global - run this compiler within a Doop project only');

	var settings = {
		once: false,
		config: require('../webpack.config.js'),
		configMerge: {},
		log: console.log,
		colors: true,
		...options,
	};
	if (!_.isEmpty(settings.configMerge)) _.merge(settings.config, settings.configMerge);

	return Promise.resolve()
		.then(()=> webpack(settings.config))
		.then(compiler => new Promise((resolve, reject) => {
			app.webpack = {};

			// Setup stats reporting function + compiler close {{{
			var runCycleStats = (err, stats) => {
				if (err) throw err;
				if (stats.hasErrors() || stats.hasWarnings()) {
					settings.log(stats.toString({colors: settings.colors}));
					if (stats.hasErrors()) return reject('Webpack had compilation errors');
				}
				if (err) return reject(err);

				compiler.close(closeErr => {
					wpCompilerBusy = false;
					if (closeErr) return reject(closeErr);
					resolve();
				});
			}
			// }}}

			if (settings.once) {
				compiler.run(runCycleStats);
			} else {
				app.webpack.watcher = compiler.watch({}, runCycleStats) // Stash in app.webpack for other processes to access
			}
		}))
};
