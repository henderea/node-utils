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
util.statusCheck = svc => some(spawnSync('/bin/launchctl', ['list'], {encoding: 'utf8'}).output, i => i && i.includes(`com.henderea.${svc}`));
util.svcExec = (...args) => spawnSync('/bin/launchctl', args).status;
util.svcEnable = svc => util.svcExec('enable', `${domainTarget}/com.henderea.${svc}`) == 0;
util.svcDisable = svc => util.svcExec('disable', `${domainTarget}/com.henderea.${svc}`) == 0;
util.svcBootstrap = svc => util.svcExec('bootstrap', domainTarget, path.resolve(plistDir, `com.henderea.${svc}.plist`)) == 0;
util.svcBootout = svc => util.svcExec('bootout', `${domainTarget}/com.henderea.${svc}`);
exports.statusCheck = util.statusCheck;
exports.lcStatus = svc => util.statusCheck(svc) ? chalk.green(`Service com.henderea.${svc} is loaded`) : chalk.red(`Service com.henderea.${svc} is not loaded`);
exports.lcList = () => sortBy(map(filter(fs.readdirSync(plistDir), i => startsWith(i, 'com.henderea.')), i => i.replace(/^com\.henderea\.(.*)\.plist$/g, '$1')));
exports.lcEnable = svc => util.svcEnable(svc) ? chalk.green(`Service com.henderea.${svc} was enabled`) : chalk.red(`Service com.henderea.${svc} failed to enable`);
exports.lcDisable = svc => util.svcDisable(svc) ? chalk.green(`Service com.henderea.${svc} was disabled`) : chalk.red(`Service com.henderea.${svc} failed to disable`);
exports.lcStart = svc => {
    if(util.statusCheck(svc)) {
        return chalk.yellow(`Service com.henderea.${svc} is already running`);
    }
    util.svcEnable(svc);
    if(util.svcBootstrap(svc)) {
        return chalk.green(`Service com.henderea.${svc} started`);
    }
    return chalk.red(`Service com.henderea.${svc} failed to start`);
}
util.sleep = (ms) => setTimeoutPromise(ms);
exports.lcStop = async (svc) => {
    try {
        if(!util.statusCheck(svc)) {
            return chalk.yellow(`Service com.henderea.${svc} is not running`);
        }
        let ec = util.svcBootout(svc);
        while(ec != 0 && ec != 3) {
            await util.sleep(1000);
            ec = util.svcBootout(svc);
        }
        if(util.statusCheck(svc)) {
            return chalk.red(`Service com.henderea.${svc} failed to stop.`);
        }
        return chalk.green(`Service com.henderea.${svc} stopped`);
    } catch(error) {
        return chalk.red(`Service com.henderea.${svc} failed to stop.`);
    }
}
