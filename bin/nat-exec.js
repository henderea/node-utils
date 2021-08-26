#!/usr/bin/env node

const execa = require('execa');

const arg = require('arg');
const shellEscape = require('any-shell-escape');

const _flattenDeep = require('lodash/flattenDeep');

const { natSort } = require('../lib/utils/natSort');

const args = arg(
  {
    '--command': String,
    '-c': '--command'
  },
  {
    permissive: true
  }
);

let command = args['--command'];
if(!command) { process.exit(1); }

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

let list = args._;

list = natSort(list);

if(!command.includes('@@')) {
  command = `${command} @@`;
}

command = command.replace(/@@/g, _shellEscape(list));

try {
  const { exitCode } = execa.commandSync(command, { stdio: 'inherit', stripFinalNewline: false, shell: true });
  process.exit(exitCode);
} catch (e) {
  const { exitCode } = e;
  process.exit(exitCode);
}
