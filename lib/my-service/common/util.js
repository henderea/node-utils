const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const setTimeoutPromise = promisify(setTimeout);

const { styles } = require('@henderea/simple-colors');
const { red, green, yellow } = styles;

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
util.statusCheck = (prefix, svc) => spawnSync('/bin/launchctl', ['list'], { encoding: 'utf8' }).output.some(i => i && i.includes(`${prefix}${svc}`));
util.svcExec = (...args) => spawnSync('/bin/launchctl', args).status;
util.svcEnable = (prefix, svc) => util.svcExec('enable', `${domainTarget}/${prefix}${svc}`) == 0;
util.svcDisable = (prefix, svc) => util.svcExec('disable', `${domainTarget}/${prefix}${svc}`) == 0;
util.svcBootstrap = (prefix, svc) => util.svcExec('bootstrap', domainTarget, util.resolveFileInPaths(plistDir, `${prefix}${svc}.plist`)) == 0;
util.svcBootout = (prefix, svc) => util.svcExec('bootout', `${domainTarget}/${prefix}${svc}`);
exports.spawn = util.spawn;
exports.setTitle = util.setTitle;
exports.statusCheck = util.statusCheck;
exports.lcStatus = (prefix, svc) => util.statusCheck(prefix, svc) ? green(`Service ${prefix}${svc} is loaded`) : red(`Service ${prefix}${svc} is not loaded`);
exports.lcList = (prefix) => _sortBy(_flatMap(plistDir, plDir => fs.readdirSync(plDir)).filter(i => _startsWith(i, prefix)).map(i => i.replace(new RegExp(`^${_escapeRegExp(prefix)}(.*)\.plist$`, 'g'), '$1')));
exports.lcEnable = (prefix, svc) => util.svcEnable(prefix, svc) ? green(`Service ${prefix}${svc} was enabled`) : red(`Service ${prefix}${svc} failed to enable`);
exports.lcDisable = (prefix, svc) => util.svcDisable(prefix, svc) ? green(`Service ${prefix}${svc} was disabled`) : red(`Service ${prefix}${svc} failed to disable`);
exports.lcStart = (prefix, svc) => {
    if(util.statusCheck(prefix, svc)) {
        return yellow(`Service ${prefix}${svc} is already running`);
    }
    util.svcEnable(prefix, svc);
    if(util.svcBootstrap(prefix, svc)) {
        return green(`Service ${prefix}${svc} started`);
    }
    return red(`Service ${prefix}${svc} failed to start`);
}
exports.lcStop = async (prefix, svc) => {
    try {
        if(!util.statusCheck(prefix, svc)) {
            return yellow(`Service ${prefix}${svc} is not running`);
        }
        let ec = util.svcBootout(prefix, svc);
        while(ec != 0 && ec != 3) {
            await util.sleep(1000);
            ec = util.svcBootout(prefix, svc);
        }
        if(util.statusCheck(prefix, svc)) {
            return red(`Service ${prefix}${svc} failed to stop.`);
        }
        return green(`Service ${prefix}${svc} stopped`);
    } catch(error) {
        return red(`Service ${prefix}${svc} failed to stop.`);
    }
}
