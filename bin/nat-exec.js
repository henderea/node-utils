#!/usr/bin/env node

const arg = require('arg');
const { orderBy } = require('natural-orderby');
const shellEscape = require('any-shell-escape');
const _flattenDeep = require('lodash/flattenDeep');
const child_process = require('child_process');

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
    let escaped = [__shellEscape(params)]
    let flattened = _flattenDeep(escaped)
    return flattened.join(' ')
}

function __shellEscape(params) {
    if(Array.isArray(params)) {
        return params.map(param => __shellEscape(param))
    } else if(params == null) {
        return []
    } else {
        return shellEscape(String(params))
    }
}

let list = args._;

list = orderBy(list, [v => v.replace(/[_-]/g, ' '), v => v]);

if(!command.includes('@@')) {
    command = `${command} @@`;
}

command = command.replace(/@@/g, _shellEscape(list));

child_process.execSync(command, { stdio: 'inherit' });