#!/usr/bin/env node

import { readAll } from '../lib/utils/readAll.mjs';

import { stripAccents } from '../lib/accents.mjs';

const run = async () => {
  let input = await readAll(process.stdin, true);
  process.stdout.write(stripAccents(input));
};

run();
