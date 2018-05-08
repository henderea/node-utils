#!/usr/bin/env node
const _ = require('lodash');
const moment = require('moment-timezone');
const chalk = require('chalk');
const args = require('../lib/arg-handler');

const {options, arg} = args()
    .addFlag('help', ['-h', '--help', 'help'])
    .addFlag('outputFormat', ['-o', '--output-format', '-f', '--format'], {acceptsParameter: true, accumulate: true})
    .addFlag('inputFormat', ['-i', '--input-format'], {acceptsParameter: true})
    .addFlag('date', ['-d', '--date'], {acceptsParameter: true})
    .addFlag('outputTimezone', ['-t', '--output-timezone'], {acceptsParameter: true})
    .addFlag('inputTimezone', ['-z', '--input-timezone'], {acceptsParameter: true})
    .parse();

if(options.help) {
    const arg = chalk.underline.blue;
    const opt = chalk.underline.gray;
    const optional = chalk.gray('(optional)');
    const section = chalk.bold.underline;
    const name = chalk.bold.green;
    console.log(`${section('USAGE')}:
${name('moment-date')} ${arg('-h|--help|help')}
${name('moment-date')} ${opt('[-o|--output-format|-f|--format OUTPUT_FORMAT]')} ${opt('[-i|--input-format INPUT_FORMAT]')} ${opt('[-d|--date DATE]')} ${opt('[-t|--output-timezone OUTPUT_TIMEZONE]')} ${opt('[-z|--input-timezone INPUT_TIMEZONE]')}

${section('FLAGS')}:
${arg('-h|--help|help')}                               -> display this help
${opt('-o|--output-format|-f|--format OUTPUT_FORMAT')} -> ${optional} specify an output format to use; provide this flag multiple times to specify multiple output formats; if this flag is not provided, the milliseconds since the epoch will be outputted
${opt('-i|--input-format INPUT_FORMAT')}               -> ${optional} specify the input format if using the ${opt('-d|--date DATE')} option; if the input format is not provided, will try to use default date parsing logic, and will treat a numeric-only date as a number of milliseconds since the epoch
${opt('-d|--date DATE')}                               -> ${optional} specify the date to use
${opt('-t|--output-timezone OUTPUT_TIMEZONE')}         -> ${optional} specify the output timezone to use; defaults to input timezone if provided, otherwise uses the system timezone
${opt('-z|--input-timezone INPUT_TIMEZONE')}           -> ${optional} specify the input timezone to use if using the ${opt('-d|--date DATE')} option; defaults to the system timezone

${section('SEE ALSO')}:
Info on formatting specification can be found at http://momentjs.com/docs/#/displaying/format/`);
    process.exit(0);
}

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