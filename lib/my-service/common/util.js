const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const promisify = require('util').promisify;
const setTimeoutPromise = promisify(setTimeout);

const chalk = require('chalk');

const some = require('lodash/some');
const sortBy = require('lodash/sortBy');
const map = require('lodash/map');
const filter = require('lodash/filter');
const startsWith = require('lodash/startsWith');
const escapeRegExp = require('lodash/escapeRegExp');

let _domainTarget = 'system';
let _plistDir = '/Library/LaunchDaemons';
if(process.geteuid() != 0) {
    _domainTarget = `gui/${process.geteuid()}`;
    _plistDir = path.resolve(process.env['HOME'], 'Library/LaunchAgents');
}

const domainTarget = _domainTarget;
const plistDir = _plistDir;

exports.domainTarget = domainTarget;
exports.plistDir = plistDir;

const util = {};
util.sleep = (ms) => setTimeoutPromise(ms);
util.statusCheck = (prefix, svc) => some(spawnSync('/bin/launchctl', ['list'], {encoding: 'utf8'}).output, i => i && i.includes(`${prefix}${svc}`));
util.svcExec = (...args) => spawnSync('/bin/launchctl', args).status;
util.svcEnable = (prefix, svc) => util.svcExec('enable', `${domainTarget}/${prefix}${svc}`) == 0;
util.svcDisable = (prefix, svc) => util.svcExec('disable', `${domainTarget}/${prefix}${svc}`) == 0;
util.svcBootstrap = (prefix, svc) => util.svcExec('bootstrap', domainTarget, path.resolve(plistDir, `${prefix}${svc}.plist`)) == 0;
util.svcBootout = (prefix, svc) => util.svcExec('bootout', `${domainTarget}/${prefix}${svc}`);
exports.statusCheck = util.statusCheck;
exports.lcStatus = (prefix, svc) => util.statusCheck(prefix, svc) ? chalk.green(`Service ${prefix}${svc} is loaded`) : chalk.red(`Service ${prefix}${svc} is not loaded`);
exports.lcList = (prefix) => sortBy(map(filter(fs.readdirSync(plistDir), i => startsWith(i, prefix)), i => i.replace(new RegExp(`^${escapeRegExp(prefix)}(.*)\.plist$`, 'g'), '$1')));
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
