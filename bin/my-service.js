#!/usr/bin/env node
const _ = require('lodash');
const chalk = require('chalk');
const yargs = require('yargs');
const argv = yargs
    .usage('Usage: $0 command [args]')
    .wrap(yargs.terminalWidth())
    .commandDir('../lib/my-service')
    .help('h')
    .alias('h', 'help')
    .argv;