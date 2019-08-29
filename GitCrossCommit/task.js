const tl                =   require('vso-task-lib');
const lib               =   require('./lib');



const echo = new tl.ToolRunner(tl.which('echo', true));

lib.cloneGitRepo(tl).then(lib.copyArtifacts.bind(this,tl), handleError).then(lib.commitToRepo.bind(this,tl), handleError).then(function(results){
    console.log(results);
}).catch(handleError);

function handleError(error){
    console.error(JSON.stringify(error, Object.getOwnPropertyNames(error)));
    tl.debug('taskRunner fail');
    tl.exit(1);
}
