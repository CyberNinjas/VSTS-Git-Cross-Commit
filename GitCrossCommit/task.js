const path              =   require('path');
const tl                =   require('vso-task-lib');
const lib               =   require('./lib');

var echo = new tl.ToolRunner(tl.which('echo', true));

var repoUrl = tl.getInput('repoUrl', true);
echo.arg(repoUrl);

var repoPath = tl.getInput('repoPath', true);
echo.arg(repoPath);

var sourcePath = tl.getInput('sourcePath', true);
echo.arg(sourcePath);

var destinationPath = tl.getInput('destinationPath', true);
echo.arg(destinationPath);



var cwd = tl.getPathInput('cwd', false);

// will error and fail task if it doesn't exist
tl.checkPath(cwd, 'cwd');
tl.cd(cwd);

echo.exec({ failOnStdErr: false})
.then(function(code) {
    tl.exit(code);
})
.fail(function(err) {
    console.error(err.message);
    tl.debug('taskRunner fail');
    tl.exit(1);
})
