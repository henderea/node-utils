#!/usr/bin/env node

import { setTitle } from '../lib/my-service/common/util.mjs';

if(process.env.ITERM_SESSION_ID) {
  setTitle('my-service');
}

global.child_processes = [];

process.on('SIGINT', () => {
  if(global.child_processes.length == 0) {
    process.exit();
  }
});

import disable from '../lib/my-service/disable.mjs';
import enable from '../lib/my-service/enable.mjs';
import log from '../lib/my-service/log.mjs';
import elog from '../lib/my-service/elog.mjs';
import tail from '../lib/my-service/tail.mjs';
import etail from '../lib/my-service/etail.mjs';
import list from '../lib/my-service/list.mjs';
import start from '../lib/my-service/start.mjs';
import stop from '../lib/my-service/stop.mjs';
import restart from '../lib/my-service/restart.mjs';
import load from '../lib/my-service/load.mjs';
import unload from '../lib/my-service/unload.mjs';
import status from '../lib/my-service/status.mjs';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
yargs(hideBin(process.argv))
  .parserConfiguration({
    'unknown-options-as-args': true
  })
  .usage('Usage: $0 command [args]')
  .wrap(120)
  .command(disable)
  .command(enable)
  .command(log)
  .command(elog)
  .command(tail)
  .command(etail)
  .command(list)
  .command(start)
  .command(stop)
  .command(restart)
  .command(load)
  .command(unload)
  .command(status)
  .option('p', {
    alias: 'prefix',
    default: 'com.henderea.',
    describe: 'specify an alternate prefix',
    type: 'string'
  })
  .help('h')
  .alias('h', 'help')
  .argv;
