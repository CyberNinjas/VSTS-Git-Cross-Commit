const fs                =   require('fs');
const path              =   require('path');
const tl                =   require('vso-task-lib');
const q                 =   require('q');
const lib               =   require('./lib');

const copyFile          =   q.denodeify(fs.copyFile);


const echo = new tl.ToolRunner(tl.which('echo', true));

const repoUrl = lib.replaceVariables(tl.getInput('repoUrl', true));
//const repoUrl = "https://cyberninjas.visualstudio.com/DefaultCollection/web-tools/_git/web-tools";
let repoPath = lib.replaceVariables(tl.getInput('repoPath', false) ? tl.getInput('repoPath', false) : "");
let sourcePath = tl.getInput('sourcePath', false);
//let sourcePath = lib.replaceVariables("target\\IssueExtender-$($build.version).jar");
sourcePath = path.join(process.env.BUILD_SOURCESDIRECTORY, sourcePath);
const destinationPath = lib.replaceVariables(tl.getInput('destinationPath', false));
//let destinationPath = lib.replaceVariables("burp\\beta-plugins\\IssueExtender-$($build.version).jar");


lib.execCommand('git clone ' + repoUrl + ' ' + repoPath, {} ).then(function(results){
    const folderMatches = /Cloning\s+into\s+'([^']+)'/.exec(results.stderr);
    repoPath = folderMatches[1];
    destinationPath = path.join(process.env.BUILD_SOURCEDIRECTORY, repoPath, destinationPath);
    copyFile(sourcePath, destinationPath).then(function(results){
        console.log(results);
    }).catch(function(error){
        console.log(error.message);
    });
    console.log("Success:");
}).catch(function(error){
    console.log("Error:");
    console.log(error.message);
});

/**
echo.exec({ failOnStdErr: false})
.then(function(code) {
    tl.exit(code);
})
.fail(function(err) {
    console.error(err.message);
    tl.debug('taskRunner fail');
    tl.exit(1);
})//*/
