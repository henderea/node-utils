#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment-timezone');
const chalk = require('chalk');
const yargs = require('yargs');
var options = yargs
    .usage('Usage: $0 [options]')
    .epilog('Info on formatting specification can be found at http://momentjs.com/docs/#/displaying/format/')
    .wrap(yargs.terminalWidth())
    .help('h')
    .alias('h', 'help')
    .alias('o', ['output-format', 'f', 'format'])
    .nargs('o', 1)
    .array('o')
    .describe('o', 'specify an output format to use; provide this flag multiple times to specify multiple output formats; if this flag is not provided, the milliseconds since the epoch will be outputted')
    .default('o', 'x')
    .alias('i', 'input-format')
    .nargs('i', 1)
    .string('i')
    .describe('i', 'specify the input format; if the input format is not provided, will try to use default date parsing logic, and will treat a numeric-only date as a number of milliseconds since the epoch')
    .alias('d', 'date')
    .nargs('d', 1)
    .string('d')
    .describe('d', 'specify the date to use')
    .implies('i', 'd')
    .alias('t', 'output-timezone')
    .nargs('t', 1)
    .string('t')
    .describe('t', 'specify the output timezone to use; defaults to input timezone if provided, otherwise uses the system timezone')
    .alias('z', 'input-timezone')
    .nargs('z', 1)
    .string('z')
    .describe('z', 'specify the input timezone to use; defaults to the system timezone')
    .implies('z', 'd')
    .argv;

let date = moment();
if(options.date) {
    if(options.inputFormat) {
        if(options.inputTimezone) {
            date = moment.tz(options.date, options.inputFormat, options.inputTimezone);
        } else {
            date = moment(options.date, options.inputFormat);
        }
    } else {
        if(/^\d+$/.test(options.date)) {
            options.date = parseInt(options.date);
        }
        if(options.inputTimezone) {
            date = moment.tz(options.date, options.inputTimezone);
        } else {
            date = moment(options.date);
        }
    }
}

if(options.outputTimezone) {
    date = date.tz(options.outputTimezone);
} else if(!options.inputTimezone) {
    date = date.tz(moment.tz.guess());
}

if(options.outputFormat) {
    console.log(_.map(options.outputFormat, (format) => date.format(format)).join('\n'));
} else {
    console.log(`${+date}`);
}