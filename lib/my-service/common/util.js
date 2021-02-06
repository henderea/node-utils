const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const setTimeoutPromise = promisify(setTimeout);

const { styles } = require('@henderea/simple-colors');
const { red, green, yellow, blue } = styles;

const _sortBy = require('lodash/sortBy');
const _flatMap = require('lodash/flatMap');
const _startsWith = require('lodash/startsWith');
const _escapeRegExp = require('lodash/escapeRegExp');

let _domainTarget = 'system';
let _plistDir = ['/Library/LaunchDaemons', '/Library/LaunchAgents'];
if(process.geteuid() != 0) {
    _domainTarget = `gui/${process.geteuid()}`;
    _plistDir = [path.resolve(process.env['HOME'], 'Library/LaunchAgents')];
}

const domainTarget = _domainTarget;
const plistDir = _plistDir;

const util = {};
util.spawn = async (command, args, options = {}) => {
    return new Promise((resolve, reject) => {
        let subprocess = spawn(command, args, options);
        global.child_processes.push(subprocess);
        subprocess.on('exit', (code, signal) => {
            global.child_processes.splice(global.child_processes.findIndex(p => p == subprocess));
            resolve({ code, signal })
        });
        subprocess.on('error', (err) => reject(err));
    });
};
util.setTitle = title => process.stdout.write(`\u001b]0;${title}\u0007`);
util.resolvePaths = (paths) => paths.find(p => fs.existsSync(p));
util.resolveFileInPaths = (paths, file) => util.resolvePaths(paths.map(p => path.resolve(p, file)));
util.sleep = async (ms) => setTimeoutPromise(ms);
util.statusCheck = (prefix, svc) => {
    const { output, status } = spawnSync('/bin/launchctl', ['print', `${domainTarget}/${prefix}${svc}`], { encoding: 'utf8' });
    if(status != 0) {
        const path = util.resolveFileInPaths(plistDir, `${prefix}${svc}.plist`);
        if(!path) { return -2; }
        return -1;
    }
    if(/\s+state\s+=\s+running\s+/.test(output)) { return 1; }
    return 0;
};
util.svcExec = (...args) => spawnSync('/bin/launchctl', args).status;
util.svcEnable = (prefix, svc) => util.svcExec('enable', `${domainTarget}/${prefix}${svc}`) == 0;
util.svcDisable = (prefix, svc) => util.svcExec('disable', `${domainTarget}/${prefix}${svc}`) == 0;
util.svcLoad = (prefix, svc) => util.svcExec('load', util.resolveFileInPaths(plistDir, `${prefix}${svc}.plist`)) == 0;
util.svcUnload = (prefix, svc) => util.svcExec('unload', util.resolveFileInPaths(plistDir, `${prefix}${svc}.plist`)) == 0;
util.svcStart = (prefix, svc) => util.svcExec('start', `${prefix}${svc}`) == 0;
util.svcStop = (prefix, svc) => util.svcExec('stop', `${prefix}${svc}`) == 0;
exports.spawn = util.spawn;
exports.setTitle = util.setTitle;
exports.statusCheck = util.statusCheck;
exports.lcStatus = (prefix, svc) => {
    const status = util.statusCheck(prefix, svc);
    if(status == 1) { return green(`Service ${prefix}${svc} is running`); }
    if(status == 0) { return blue(`Service ${prefix}${svc} is loaded`); }
    if(status == -2) { return red(`Service ${prefix}${svc} could not be found`); }
    return red(`Service ${prefix}${svc} is not loaded`);
}
exports.lcList = (prefix) => _sortBy(_flatMap(plistDir, plDir => fs.readdirSync(plDir)).filter(i => _startsWith(i, prefix)).map(i => i.replace(new RegExp(`^${_escapeRegExp(prefix)}(.*)\.plist$`, 'g'), '$1')));
exports.lcEnable = (prefix, svc) => util.svcEnable(prefix, svc) ? green(`Service ${prefix}${svc} was enabled`) : red(`Service ${prefix}${svc} failed to enable`);
exports.lcDisable = (prefix, svc) => util.svcDisable(prefix, svc) ? green(`Service ${prefix}${svc} was disabled`) : red(`Service ${prefix}${svc} failed to disable`);
exports.lcLoad = (prefix, svc) => util.svcLoad(prefix, svc) ? green(`Service ${prefix}${svc} was loaded`) : red(`Service ${prefix}${svc} failed to load`);
exports.lcUnload = (prefix, svc) => util.svcUnload(prefix, svc) ? green(`Service ${prefix}${svc} was unloaded`) : red(`Service ${prefix}${svc} failed to unload`);
exports.lcStart = (prefix, svc) => {
    const status = util.statusCheck(prefix, svc);
    if(status > 0) { return yellow(`Service ${prefix}${svc} is already running`); }
    if(status == -2) { return red(`Service ${prefix}${svc} could not be found`); }
    if(status == -1) { util.svcLoad(prefix, svc); }
    util.svcEnable(prefix, svc);
    if(util.svcStart(prefix, svc)) {
        return green(`Service ${prefix}${svc} started`);
    }
    return red(`Service ${prefix}${svc} failed to start`);
}
exports.lcStop = async (prefix, svc) => {
    try {
        let s = util.statusCheck(prefix, svc);
        if(s == -2) { return red(`Service ${prefix}${svc} could not be found`); }
        if(s == -1) { return red(`Service ${prefix}${svc} is not loaded`); }
        if(s == 0) {
            return yellow(`Service ${prefix}${svc} is not running`);
        }
        util.svcStop(prefix, svc);
        s = util.statusCheck(prefix, svc);
        while(s > 0) {
            await util.sleep(1000);
            util.svcStop(prefix, svc);
            s = util.statusCheck(prefix, svc);
        }
        if(util.statusCheck(prefix, svc) > 0) {
            return red(`Service ${prefix}${svc} failed to stop.`);
        }
        return green(`Service ${prefix}${svc} stopped`);
    } catch(error) {
        return red(`Service ${prefix}${svc} failed to stop.`);
    }
}
