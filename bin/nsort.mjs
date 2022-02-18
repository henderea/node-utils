#!/usr/bin/env node

import arg from 'arg';
import shellEscape from 'any-shell-escape';

import _flattenDeep from 'lodash/flattenDeep.js';

import { natSort } from '../lib/utils/natSort.mjs';
import { readAll } from '../lib/utils/readAll.mjs';

const args = arg(
  {
    '--reverse': Boolean,
    '-rc': '--reverse',
    '--zero': Boolean,
    '-0': '--zero',
    '--escape': Boolean,
    '-e': '--escape',
    '--array-escape': Boolean,
    '-E': '--array-escape'
  },
  {
    permissive: true
  }
);

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

const run = async () => {
  let input = await readAll(process.stdin);
  let trimmedInput = input.replace(/\n$/m, '');
  let endedInNewLine = trimmedInput != input;
  let lines = trimmedInput.replace(/\0$/m, '').split(args['--zero'] ? /\0/g : /\n/g);
  let sortedLines = natSort(lines);
  if(args['--reverse']) { sortedLines = sortedLines.reverse(); }
  if(args['--array-escape']) {
    process.stdout.write(_shellEscape(sortedLines));
  } else {
    if(args['--escape']) { sortedLines = sortedLines.map((l) => _shellEscape(l)); }
    process.stdout.write(sortedLines.join(args['--zero'] ? '\0' : '\n'));
    if(endedInNewLine) { process.stdout.write('\n'); }
  }
  process.exit(0);
};

run();
