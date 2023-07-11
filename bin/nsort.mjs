#!/usr/bin/env node

import { fileURLToPath } from 'url';

import shellEscape from 'any-shell-escape';
import stripAnsi from 'strip-ansi';

import _flattenDeep from 'lodash/flattenDeep.js';
import _uniq from 'lodash/uniq.js';

import { natSort } from '../lib/utils/natSort.mjs';
import { readAll } from '../lib/utils/readAll.mjs';

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

const helpText = new HelpTextMaker('nsort')
  .wrap()
  .title.nl
  .pushWrap(4)
  .tab.text('Sort stdin using natural sort order').nl
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
  .key.tab.text('    ').flag('--help').value.text('Show help').end.nl
  .key.tab.flag('-r', '--reverse').value.text('Sort in reverse order').end.nl
  .key.tab.flag('-0', '--zero').value.text('The input is separated by the NULL byte instead of newlines').end.nl
  .key.tab.flag('-e', '--escape').value.text('Apply shell escaping to each entry').end.nl
  .key.tab.flag('-E', '--array-escape').value.text('Apply shell escaping to the entire output, for putting in an array').end.nl
  .key.tab.flag('-a', '--ansi-escaped').value.text('Ignore ANSI escape sequences when comparing items').end.nl
  .key.tab.flag('-b', '--ignore-leading-blanks').value.text('Ignore leading blank characters when comparing items').end.nl
  .key.tab.flag('-h', '--byte-sort').value.text('Handle byte unit suffixes, using a base of 1000').end.nl
  .key.tab.flag('-H', '--binary-byte-sort').value.text('Handle byte unit suffixes, using a base of 1024').end.nl
  .key.tab.flag('-u', '--uniq').value.text('Only output unique values').end.nl
  .end
  .popWrap()
  .nl
  .toString(wrapSize);

let options = null;
try {
  options = argParser()
    .bool('reverse', '-r', '--reverse')
    .bool('zero', '-0', '--zero')
    .bool('escape', '-e', '--escape')
    .bool('arrayEscape', '-E', '--array-escape')
    .bool('ansiEscaped', '-a', '--ansi-escaped')
    .bool('ignoreLeadingBlanks', '-b', '--ignore-leading-blanks')
    .bool('byteSort', '-h', '--byte-sort')
    .bool('binaryByteSort', '-H', '--binary-byte-sort')
    .bool('uniq', '-u', '--uniq')
    .help(helpText, '--help')
    .findVersion(dirname, '--version')
    .argv;
} catch (e) {
  console.error(red.bright(`${bold('Error in arguments:')} ${e.message}`));
  process.exit(1);
}

function _shellEscape(params) {
  let escaped = [__shellEscape(params)];
  let flattened = _flattenDeep(escaped);
  return flattened.join(' ');
}

function __shellEscape(params) {
  if(Array.isArray(params)) {
    return params.map((param) => __shellEscape(param));
  } else if(params == null) {
    return [];
  } else {
    return shellEscape(String(params));
  }
}

const units = ['B', 'K', 'M', 'G', 'T'];

function byteAdjuster(base) {
  if(base <= 0) { return (l) => l; }
  return (l) => {
    return l.replace(/\b(\d+(?:\.\d+)?)\s*([Bb]|[KkMmGgTt][Ii]?[Bb]?)\b/g, (_m, value, unit) => {
      const unitChar = unit[0].toUpperCase();
      const numericValue = parseFloat(value);
      const unitIndex = units.indexOf(unitChar);
      if(unitIndex < 0) {
        return `${value}${unitChar}`;
      }
      return `${numericValue * Math.pow(base, unitIndex)}B`;
    });
  };
}

const cleanAnsi = options.ansiEscaped ? (l) => stripAnsi(l) : (l) => l;
const cleanLeadingBlanks = options.ignoreLeadingBlanks ? (l) => l.replace(/^\s+/, '') : (l) => l;
const adjustBytes = byteAdjuster(options.binaryByteSort ? 1024 : (options.byteSort ? 1000 : 0));

const cleanLine = (l) => adjustBytes(cleanLeadingBlanks(cleanAnsi(l)));

const run = async () => {
  let input = await readAll(process.stdin);
  let trimmedInput = input.replace(/\n$/m, '');
  let endedInNewLine = trimmedInput != input;
  let lines = trimmedInput.replace(/\0$/m, '').split(options.zero ? /\0/g : /\r?\n/g);
  let sortedLines = natSort(lines, cleanLine);
  if(options.reverse) { sortedLines = sortedLines.reverse(); }
  if(options.uniq) { sortedLines = _uniq(sortedLines); }
  if(options.arrayEscape) {
    process.stdout.write(_shellEscape(sortedLines));
  } else {
    if(options.escape) { sortedLines = sortedLines.map((l) => _shellEscape(l)); }
    process.stdout.write(sortedLines.join(options.zero ? '\0' : '\n'));
    if(endedInNewLine) { process.stdout.write('\n'); }
  }
  process.exit(0);
};

run();
