#!/usr/bin/env node

import { fileURLToPath } from 'url';

import moment from 'moment-timezone';
import momentDurationFormat from 'moment-duration-format';
momentDurationFormat(moment);

import { argParser } from '../lib/utils/arg-helper.mjs';
import { HelpTextMaker, styles } from '@henderea/simple-colors/helpText.js';
const { red, bold } = styles;

let dirname = fileURLToPath(import.meta.url);

try {
  dirname = eval('__dirname');
} catch {
  //empty
}

const wrapSize = Math.max(Math.min(argParser.terminalWidth(0.6), 200), 120);

const helpText = new HelpTextMaker('moment-date')
  .wrap()
  .title.nl
  .pushWrap(4)
  .tab.text('A tool for working with the Moment.js library').nl
  .popWrap()
  .nl
  .usage.nl
  .pushWrap(4)
  .tab.name.space.flag('[options]').nl
  .popWrap()
  .nl
  .flags.nl
  .pushWrap(8)
  .dict
  .key.tab.text('    ').flag('--version').value.text('Show version number').end.nl
  .key.tab.flag('-h', '--help').value.text('Show help').end.nl
  .key.tab.flag('-o', '-f', '--output-format', '--format').value.text('Specify an output format to use; provide this flag multiple times to specify multiple output formats; if this flag is not provided, the milliseconds since the epoch will be outputted').end.nl
  .key.tab.flag('-i', '--input-format').value.text('Specify the input format; if the input format is not provided, will try to use default date parsing logic, and will treat a numeric-only date as a number of milliseconds since the epoch').end.nl
  .key.tab.flag('-d', '--date').value.text('Specify the date to use').end.nl
  .key.tab.flag('-t', '--output-timezone').value.text('Specify the output timezone to use; defaults to input timezone if provided, otherwise uses the system timezone').end.nl
  .key.tab.flag('-z', '--input-timezone').value.text('Specify the input timezone to use; defaults to the system timezone').end.nl
  .key.tab.flag('-s', '--duration-format').value.text('Specify a duration format to use; treats the input date as a number of milliseconds of the duration').end.nl
  .end
  .popWrap()
  .nl
  .text('Info on formatting specification can be found at http://momentjs.com/docs/#/displaying/format/').nl
  .toString(wrapSize);

let options = null;
try {
  options = argParser()
    .strings('outputFormat', '-o', '-f', '--output-format', '--format')
    .string('inputFormat', '-i', '--input-format')
    .string('date', '-d', '--date')
    .string('outputTimezone', '-t', '--output-timezone')
    .string('inputTimezone', '-z', '--input-timezone')
    .string('durationFormat', '-s', '--duration-format')
    .help(helpText, '--help', '-h')
    .findVersion(dirname, '--version')
    .argv;
} catch (e) {
  console.error(red.bright(`${bold('Error in arguments:')} ${e.message}`));
  process.exit(1);
}

if(options.durationFormat && options.date) {
  let duration = moment.duration(parseInt(options.date));
  console.log(duration.format(options.durationFormat));
} else {
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
    console.log(options.outputFormat.map((format) => date.format(format)).join('\n'));
  } else {
    console.log(`${+date}`);
  }
}
