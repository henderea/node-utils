const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const promisify = require('util').promisify;
const setTimeoutPromise = promisify(setTimeout);

const chalk = require('chalk');

const _find = require('lodash/find');
const _some = require('lodash/some');
const _sortBy = require('lodash/sortBy');
const _map = require('lodash/map');
const _flatMap = require('lodash/flatMap');
const _filter = require('lodash/filter');
const _startsWith = require('lodash/startsWith');
const _escapeRegExp = require('lodash/escapeRegExp');
const _pull = require('lodash/pull');
const _get = require('lodash/get');
const _unset = require('lodash/unset');

let _domainTarget = 'system';
let _plistDir = ['/Library/LaunchDaemons', '/Library/LaunchAgents'];
if(process.geteuid() != 0) {
    _domainTarget = `gui/${process.geteuid()}`;
    _plistDir = [path.resolve(process.env['HOME'], 'Library/LaunchAgents')];
}

const domainTarget = _domainTarget;
const plistDir = _plistDir;

// exports.domainTarget = domainTarget;
// exports.plistDir = plistDir;

const util = {};
util.spawn = async (command, args, options = {}) => {
    const onClose = _get(options, 'onClose');
    _unset(options, 'onClose');
    const handleProcess = _get(options, 'handleProcess');
    _unset(options, 'handleProcess');
    return new Promise((resolve, reject) => {
        let subprocess = spawn(command, args, options);
        global.child_processes.push(subprocess);
        if(handleProcess) { handleProcess(subprocess); }
        if(onClose) { subprocess.on('close', onClose); }
        subprocess.on('exit', (code, signal) => {
            _pull(global.child_processes, subprocess);
            resolve({ code, signal })
        });
        subprocess.on('error', (err) => reject(err));
    });
};
util.setTitle = title => process.stdout.write(`\u001b]0;${title}\u0007`);
util.resolvePaths = (paths) => _find(paths, p => fs.existsSync(p));
util.resolveFileInPaths = (paths, file) => util.resolvePaths(_map(paths, p => path.resolve(p, file)));
util.sleep = async (ms) => setTimeoutPromise(ms);
util.statusCheck = (prefix, svc) => _some(spawnSync('/bin/launchctl', ['list'], { encoding: 'utf8' }).output, i => i && i.includes(`${prefix}${svc}`));
util.svcExec = (...args) => spawnSync('/bin/launchctl', args).status;
util.svcEnable = (prefix, svc) => util.svcExec('enable', `${domainTarget}/${prefix}${svc}`) == 0;
util.svcDisable = (prefix, svc) => util.svcExec('disable', `${domainTarget}/${prefix}${svc}`) == 0;
util.svcBootstrap = (prefix, svc) => util.svcExec('bootstrap', domainTarget, util.resolveFileInPaths(plistDir, `${prefix}${svc}.plist`)) == 0;
util.svcBootout = (prefix, svc) => util.svcExec('bootout', `${domainTarget}/${prefix}${svc}`);
exports.spawn = util.spawn;
exports.setTitle = util.setTitle;
exports.statusCheck = util.statusCheck;
exports.lcStatus = (prefix, svc) => util.statusCheck(prefix, svc) ? chalk.green(`Service ${prefix}${svc} is loaded`) : chalk.red(`Service ${prefix}${svc} is not loaded`);
exports.lcList = (prefix) => _sortBy(_map(_filter(_flatMap(plistDir, plDir => fs.readdirSync(plDir)), i => _startsWith(i, prefix)), i => i.replace(new RegExp(`^${_escapeRegExp(prefix)}(.*)\.plist$`, 'g'), '$1')));
exports.lcEnable = (prefix, svc) => util.svcEnable(prefix, svc) ? chalk.green(`Service ${prefix}${svc} was enabled`) : chalk.red(`Service ${prefix}${svc} failed to enable`);
exports.lcDisable = (prefix, svc) => util.svcDisable(prefix, svc) ? chalk.green(`Service ${prefix}${svc} was disabled`) : chalk.red(`Service ${prefix}${svc} failed to disable`);
exports.lcStart = (prefix, svc) => {
    if(util.statusCheck(prefix, svc)) {
        return chalk.yellow(`Service ${prefix}${svc} is already running`);
    }
    util.svcEnable(prefix, svc);
    if(util.svcBootstrap(prefix, svc)) {
        return chalk.green(`Service ${prefix}${svc} started`);
    }
    return chalk.red(`Service ${prefix}${svc} failed to start`);
}
exports.lcStop = async (prefix, svc) => {
    try {
        if(!util.statusCheck(prefix, svc)) {
            return chalk.yellow(`Service ${prefix}${svc} is not running`);
        }
        let ec = util.svcBootout(prefix, svc);
        while(ec != 0 && ec != 3) {
            await util.sleep(1000);
            ec = util.svcBootout(prefix, svc);
        }
        if(util.statusCheck(prefix, svc)) {
            return chalk.red(`Service ${prefix}${svc} failed to stop.`);
        }
        return chalk.green(`Service ${prefix}${svc} stopped`);
    } catch(error) {
        return chalk.red(`Service ${prefix}${svc} failed to stop.`);
    }
}
