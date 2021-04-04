/**
* Patch inline loaded .vue files so that app.component() is always preceeded by `export default`
*/
module.exports = function VueNoExportFix (source) {
	return source.replace(/^(\s*)(app\.component\()/m, '$1export default $2');
};
