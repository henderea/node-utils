#!/usr/bin/env node

import { spawnSync } from 'child_process';

import chokidar from 'chokidar';

const watcher = chokidar.watch('bin/update-accents.ts');

let LAST_STATUS = 0;
watcher.on('all', () => {
  const rv = spawnSync('ts-node', ['bin/update-accents.ts'], { env: { ...process.env, VALIDATE: true, LAST_STATUS }, encoding: 'utf8', stdio: 'inherit' });
  LAST_STATUS = rv.status || 0;
});

process.on('SIGINT', () => {
  watcher.close().then(() => process.exit(0));
});

