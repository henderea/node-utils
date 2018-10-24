#!/usr/bin/env node
const _ = require('lodash');
const chalk = require('chalk');
const yargs = require('yargs');
const path = require('path');
const argv = yargs
    .usage('Usage: $0 command [args]')
    .wrap(120)
    .commandDir(path.join(__dirname, '../lib/my-service'))
    .option('p', {
        alias: 'prefix',
        default: 'com.henderea.',
        describe: 'specify an alternate prefix',
        type: 'string'
    })
    .help('h')
    .alias('h', 'help')
    .argv;