const path              =   require('path');
const tl                =   require('vso-task-lib');
const lib               =   require('./lib');

const echo = new tl.ToolRunner(tl.which('echo', true));

const repoUrl = tl.getInput('repoUrl', true);
const repoPath = tl.getInput('repoPath', true) ? tl.getInput('repoPath', true) : "";
const sourcePath = tl.getInput('sourcePath', true);
const destinationPath = tl.getInput('destinationPath', true);

console.log(process.env);
lib.execCommand('git clone ' + repoUrl ).then(function(results){
    console.log(results);
}).catch(function(error){
    console.log(error.message);
});









echo.exec({ failOnStdErr: false})
.then(function(code) {
    tl.exit(code);
})
.fail(function(err) {
    console.error(err.message);
    tl.debug('taskRunner fail');
    tl.exit(1);
})
