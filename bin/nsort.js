#!/usr/bin/env node

const arg = require('arg');
const { orderBy } = require('natural-orderby');
const { readAll } = require('../lib/utils/readAll');

const args = arg(
  {
    '--reverse': Boolean,
    '-rc': '--reverse'
  },
  {
    permissive: true
  }
);

const run = async () => {
  let input = await readAll(process.stdin);
  let trimmedInput = input.replace(/\n$/m, '');
  let endedInNewLine = trimmedInput != input;
  let lines = trimmedInput.split(/\n/g);
  let sortedLines = orderBy(lines, [(v) => v.replace(/[_-]/g, ' '), (v) => v]);
  if(args['--reverse']) { sortedLines = sortedLines.reverse(); }
  process.stdout.write(sortedLines.join('\n'));
  if(endedInNewLine) { process.stdout.write('\n'); }
  process.exit(0);
};

run();
