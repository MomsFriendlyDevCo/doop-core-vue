module.exports = function VueNoExportFix (source) {
	return source.replace(/^(\s*)(app\.component\()/m, '$1export default $2');
};
