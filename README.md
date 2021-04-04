@DOOP/Frontend-Vue
==================
Doop compiler for frontend Vue projects.

This module generally lives inside a build script.


```javascript
/**
* Process all .vue file <script frontend/>, <template/> and <style/> blocks
*/
let gulp = require('gulp');
let {compiler} = require('@doop/frontend-vue');

gulp.task('build.vue', ['load:app', 'load:app.git'], ()=>
	compiler({
		cacheCompiler: app.config.isProduction, // Reuse cached compiler in dev mode
		log: gulp.log, // Fancy logging output
	})
);
```


API
===
This module exports only one sub-module currently, the `compiler` function.


Compiler(options)
-----------------
Perform a Doop / Frontend compilation process placing all files in the `dist` directory within the parent Doop project.

This function expects the Doop global `app` to be available and it will use it for pathing, config information.

Options:

| Name            | Type       | Default          | Description                                                                      |
|-----------------|------------|------------------|----------------------------------------------------------------------------------|
| `config`        | `Object`   | Internal config* | The Webpack config to use, see notes                                             |
| `configMerge`   | `Object`   | `{}`             | Additional config to merge into base using `_.merge()`                           |
| `log`           | `function` | `console.log`    | Logging function for any output                                                  |
| `colors`        | `boolean`  | `true`           | Whether to display coloring in output                                            |
| `cacheCompiler` | `boolean`  | `false`          | Cache and reuse a webpack compiler if its available, memory expensive but faster |
