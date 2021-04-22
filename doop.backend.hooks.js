/**
* Hook file for loading into the Doop core
*/
if (!global.app) throw new Error('Cant find `app` global - run this hook file within a Doop project only');

require('./lib/expressMiddleware');
