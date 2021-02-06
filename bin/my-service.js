#!/usr/bin/env node

const util = require('../lib/my-service/common/util');

if(process.env.ITERM_SESSION_ID) {
    util.setTitle('my-service');
}

global.child_processes = [];

process.on('SIGINT', () => {
    if(global.child_processes.length == 0) {
        process.exit();
    }
});

const yargs = require('yargs');
yargs
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
    .command(require('../lib/my-service/load'))
    .command(require('../lib/my-service/unload'))
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