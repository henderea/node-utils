#!/usr/bin/env node
const _ = require('lodash');
const chalk = require('chalk');
const yargs = require('yargs');
const path = require('path');
const argv = yargs
    .usage('Usage: $0 command [args]')
    .wrap(120)
    .command(require('../lib/my-service/disable'))
    .command(require('../lib/my-service/enable'))
    .command(require('../lib/my-service/log'))
    .command(require('../lib/my-service/elog'))
    .command(require('../lib/my-service/tail'))
    .command(require('../lib/my-service/etail'))
    .command(require('../lib/my-service/list'))
    .command(require('../lib/my-service/start'))
    .command(require('../lib/my-service/stop'))
    .command(require('../lib/my-service/restart'))
    .command(require('../lib/my-service/status'))
    .option('p', {
        alias: 'prefix',
        default: 'com.henderea.',
        describe: 'specify an alternate prefix',
        type: 'string'
    })
    .help('h')
    .alias('h', 'help')
    .argv;