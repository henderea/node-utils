#!/usr/bin/env node

import arg from 'arg';

import { natSort } from '../lib/utils/natSort.mjs';
import { readAll } from '../lib/utils/readAll.mjs';

const args = arg(
  {
    '--reverse': Boolean,
    '-rc': '--reverse',
    '--zero': Boolean,
    '-0': '--zero'
  },
  {
    permissive: true
  }
);

const run = async () => {
  let input = await readAll(process.stdin);
  let trimmedInput = input.replace(/\n$/m, '');
  let endedInNewLine = trimmedInput != input;
  let lines = trimmedInput.replace(/\0$/m, '').split(args['--zero'] ? /\0/g : /\n/g);
  let sortedLines = natSort(lines);
  if(args['--reverse']) { sortedLines = sortedLines.reverse(); }
  process.stdout.write(sortedLines.join(args['--zero'] ? '\0' : '\n'));
  if(endedInNewLine) { process.stdout.write('\n'); }
  process.exit(0);
};

run();
