const q                 =   require('q');
const fs                =   require('fs-extra');
const path              =   require('path');
const exec              =   require('child_process').exec;

const _this = this;

module.exports.cloneGitRepo = function(tl){
    logData("Starting cloneGitRepo...", 1);
    const deferred = q.defer();
    const echo = new tl.ToolRunner(tl.which('echo', true));
    const repoUrl = replaceVariables(tl.getInput('repoUrl', true));
    let repoPath = replaceVariables(tl.getInput('repoPath', false) ? tl.getInput('repoPath', false) : "GitCrossCommit");
    let repoBranch = replaceVariables(tl.getInput('repoBranch', false) ? tl.getInput('repoBranch', false) : "master");

    execCommands(['rm -fr ' + repoPath, 'git init ' + repoPath ], {cwd: process.env.BUILD_SOURCESDIRECTORY}).then(function(results){
        const commands = [  'git remote add origin ' + repoUrl,
                            'git config gc.auto 0',
                            'git config --add http.extraheader "AUTHORIZATION: bearer ' + process.env.SYSTEM_ACCESSTOKEN +'"',
                            'git pull origin ' + repoBranch,
                            'git checkout ' + repoBranch
                        ];
        execCommands(commands, {cwd: path.join(process.env.BUILD_SOURCESDIRECTORY, repoPath)}).then(function(output){
            deferred.resolve({ success: true, repoPath: repoPath });
        }).catch(function(object){
            deferred.reject(object);
        });
    }).catch(function(object){
        deferred.reject(object);
    });


    return deferred.promise;
};

module.exports.copyArtifacts = function(tl, gitResults){
    logData("Starting copyArtifacts...", 1);
    const deferred = q.defer();
    const copyFile =   q.denodeify(fs.copy);
    const echo = new tl.ToolRunner(tl.which('echo', true));
    const repoFilePath = path.join(process.env.BUILD_SOURCESDIRECTORY, gitResults.repoPath);

    let sourcePath = replaceVariables(tl.getInput('sourcePath', false) ? tl.getInput('sourcePath', false) : "");
    let destinationPath = replaceVariables(tl.getInput('destinationPath', false) ? tl.getInput('destinationPath', false) : "");

    logData("sourcePath: " +sourcePath , 5);
    logData("destinationPath: " +destinationPath , 5);

    if(sourcePath && destinationPath){

        sourcePath = path.join(process.env.BUILD_SOURCESDIRECTORY, sourcePath);
        destinationPath = path.join(repoFilePath, destinationPath);
        copyFile(sourcePath, destinationPath).then(function(results){
            deferred.resolve({ success: true, repoFilePath: repoFilePath, artifactPath: destinationPath });
        }).catch(function(error){
            deferred.reject(error);
        });
    } else {
        logData("SKIPPING COPY: sourcePath or destinationPath not set", 0);
        deferred.resolve({ success: true, repoFilePath: repoFilePath, artifactPath: null });
    }

    return deferred.promise;
};

module.exports.commitToRepo = function(tl, artifactResults){
    logData("Starting commitToRepo...", 1);
    let commitMessage = replaceVariables((tl.getInput('commitMessage', false)) ? tl.getInput('commitMessage', false): "Committing build $($BUILD.VERSION)");

    if(artifactResults.artifactPath){
        const commands = [
            'git add ' + artifactResults.artifactPath,
            'git commit --message="' + commitMessage + '"',
            'git push'
        ];

        return execCommands(commands, { cwd: artifactResults.repoFilePath })
    } else {
        return q(true);
    }
};


/**
 * replaceVariables - Cycles through the string and replaces variable references with their values.
 * @param stringInput - Original string input
 * @returns - Resolve - The updated string
 *            Reject  - The error
 */
function replaceVariables(stringInput){
    let result = /\$\(\$([^)]+)\)/g.exec(stringInput);
    while( result !== null) {
        const variableName = result[1].replace(/\./g,"_");
        let variableValue = "";
        if(process.env[variableName]){
          variableValue = process.env[variableName];
        }  else {
            logData("WARNING: A variableName of " + variableName + " was used within '" + stringInput + "', but no ENV exists with that value. It will be blanked out.", 0);
        }
        stringInput = stringInput.replace( new RegExp(escapeRegExp(result[0]), "g"), variableValue);
        result = /\$\(\$([^)]+)\)/g.exec(stringInput);
    }
    return stringInput;
};

/**
 * escapeRegExp - Escapes any characters that have a special meaning in a regex.
 * @param text - Input non-escaped String
 * @returns - Updated string with all regex characters escaped.
 */
function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * execCommand - Promisifies the "exec" command
 * @param command - String - The command
 * @param settings - Object - Settings for Exec
 * @returns {promise} - Resolve - On Success - Object {command: command, settings: settings, error: error, stdout: stdout, stderr: stderr}
 *                      Reject - On Failure - Object {command: command, settings: settings, error: error, stdout: stdout, stderr: stderr}
 */
function execCommand(command, settings){
    logData("Start execCommand", 1);
    var deferred = q.defer();
    logData("Executing the command:" + command, 3);
    exec(command, settings, function(error, stdout, stderr) {
        if (error) {
            deferred.reject({command: command, settings: settings, error: error, stdout: stdout, stderr: stderr})
        } else {
            deferred.resolve({command: command, settings: settings, error: error, stdout: stdout, stderr: stderr})
        }
    });
    return deferred.promise;
};


/**
 * execCommands - Run a series of commands and return their results.
 * @param commands - String or Array of commands to run
 * @param settings - Settings for Exec
 * @returns {promise} - Resolve - Last command {command: command, settings: settings, error: error, stdout: stdout, stderr: stderr}
 *                      Reject  - {command: command, settings: settings, error: error, stdout: stdout, stderr: stderr}
 */
function execCommands(commands, settings){
    logData("Start ExecCommands", 1);
    var results = [];
    if(typeof commands === 'string')
        commands = [commands];

    var result = q();
    commands.map(function(command){
        return execCommand.bind(this, command, settings);
    }).forEach(function (command) {
        result = result.then(command);
    });
    return result;
}

function logData(data, level){
    "use strict";
    let logLevel = (parseInt(process.env.SYSTEM_DEBUG_LEVEL)) ? parseInt(process.env.SYSTEM_DEBUG_LEVEL) : 0;
    logLevel = (process.env.SYSTEM_DEBUG) ? 10 : logLevel;

    if(logLevel >= level){
        console.log(data);
    }
}
