/**
* Patch inline loaded .vue files so that app.component() and app.mgComponent() are always preceeded by `export default`,
* while also ensuring files which `import` have an `export`
*/
module.exports = function (source) {
	// Automatically export Vue components
	// FIXME: This export app.component when it exists in a file with others?
	source = source.replace(/^(\s*)(app\.(mgC|c){1}omponent\()/m, '$1export default $2');

	// Export a default when importing modules
	if (
		/^\s*<script/m.test(source) &&
		/^\s*import/m.test(source) &&
		!/^\s*export/m.test(source)
	) return source.replace(/^(\s*)(<\/script>)/m, '$1export default {}$2');

	return source;
}
