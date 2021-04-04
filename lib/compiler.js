var _ = require('lodash');
var fs = require('fs');
var glob = require('globby');
var exec = require('@momsfriendlydevco/exec');
var webpack = require('webpack');

/**
* Webpack frontend compiler for Doop@3 + Vue
*
* @type {function}
* @param {Object} [options] Additional options when compiling
* @param {Object} [options.config] Config object to use, defaults to the base node_modules/@doop/frontend-vue/webpack.config.js
* @param {Object} [options.configMerge] Additional config options to merge into the base config using _.merge()
* @param {function} [options.log=console.log] Logging function for output status messages
* @param {boolean} [options.colors=true] Whether to enable color output
* @returns {Promise} A promise which will resolve when the compile process has completed
*/
module.exports = function DoopFrontendVue(options) {
	if (!global.app) throw new Error('Cant find `app` global - run this compiler within a Doop project only');

	var settings = {
		config: require('../webpack.config.js'),
		configMerge: {},
		log: console.log,
		colors: true,
		...options,
	};
	if (!_.isEmpty(settings.configMerge)) _.merge(settings.config, settings.configMerge);

	return Promise.all([
		// Setup entry point {{{
		glob([
			'app/app.frontend.setup.js',
			...app.config.paths.ignore,
		])
			.then(paths => [
				'// Auto-generated front-end import file for "setup" entry point',
				`// @date ${(new Date()).toLocaleString('en-AU', {timeZone: app.config.time.timezone})}`,
				'',
				...paths.map(path => `import '/${path}';`),
			])
			.then(content => fs.promises.writeFile(`${app.config.paths.root}/frontend.doop.setup.js`, content.join('\n'))),
		// }}}

		// Main entry point {{{
		glob([
			'app/app.frontend.vue',
			'**/*.vue',
			...app.config.paths.ignore,
		])
			.then(paths => [
				'// Auto-generated front-end import file for "main" entry point',
				`// @date ${(new Date()).toLocaleString('en-AU', {timeZone: app.config.time.timezone})}`,
				'',
				...paths.map(path => `import '/${path}';`),
				'app.init();',
			])
			.then(content => fs.promises.writeFile(`${app.config.paths.root}/frontend.doop.vue.js`, content.join('\n'))),
		// }}}
	])
		.then(()=> webpack(settings.config))
		.then(compiler => new Promise((resolve, reject) => {
			compiler.run((err, stats) => {
				if (stats.hasErrors() || stats.hasWarnings()) {
					settings.log(stats.toString({colors: settings.colors}));
					if (stats.hasErrors()) return reject('Webpack had compilation errors');
				}
				if (err) return reject(err);

				compiler.close(closeErr => {
					if (closeErr) return reject(closeErr);
					resolve();
				});
			})
		}))
		.then(()=> exec([ // FIXME: Even worse kludge to fix up <script/> tags not exporting components via vue-loader
			'perl',
			'-pi',
			'-e',
			"s/(var options = typeof scriptExports === 'function'.*? : scriptExports)/\\1 \\|\\| {}/g",
			`${app.config.paths.root}/dist/app.main.js`,
		], {log: settings.log}))
		.catch(e => e === 'SKIP' ? Promise.resolve() : Promise.reject(e))
		.finally(()=> Promise.all([
			fs.promises.unlink(`${app.config.paths.root}/frontend.doop.setup.js`).catch(e => null),
			fs.promises.unlink(`${app.config.paths.root}/frontend.doop.setup.js.map`).catch(e => null),
			fs.promises.unlink(`${app.config.paths.root}/frontend.doop.vue.js`).catch(e => null),
		]))
};
