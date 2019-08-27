const q                 =   require('q');
const exec              = require('child_process').exec;

/**
 * execCommand - Promisifies the "exec" command
 * @param command - String - The command
 * @param settings - Object - Settings for Exec
 * @returns {promise} - Resolve - On Success - Object {command: command, settings: settings, error: error, stdout: stdout, stderr: stderr}
 *                      Reject - On Failure - Object {command: command, settings: settings, error: error, stdout: stdout, stderr: stderr}
 */
module.exports.execCommand = function(command, settings){
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
module.exports.execCommands = function(commands, settings){
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
