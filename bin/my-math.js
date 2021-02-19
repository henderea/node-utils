#!/usr/bin/env node

const { argParser } = require('@henderea/arg-helper')(require('arg'));

let options = null;
try {
    options = argParser()
        .string('op', '--op', '-o')
        .string('round', '--round', '-r')
        .argv;
} catch(e) {
    console.error(red.bright(`${bold('Error in arguments:')} ${e.message}`));
    process.exit(1);
}

let op = ((op) => {
    if(!op) { return 'sum'; }
    if(op == 's' || op == 'sum') { return 'sum'; }
    if(op == 'a' || op == 'avg' || op == 'average') { return 'avg'; }
    return 'sum';
})(options.op);

let round = ((round) => {
    if(!round) { return v => v; }
    if(round == 'r' || round == 'round') { return v => Math.round(v); }
    if(round == 'c' || round == 'ceil') { return v => Math.ceil(v); }
    if(round == 'f' || round == 'floor') { return v => Math.floor(v); }
    return v => v;
})(options.round);

let items = options._.map(i => parseFloat(i)).filter(i => !Number.isNaN(i));
if(items.length == 0) {
    process.stdout.write('-');
    if(process.stdout.isTTY) { process.stdout.write('\n'); }
    process.exit(1);
}

let rv = items.reduce((s, i) => s + i, 0);
if(op == 'avg') {
    rv = rv / items.length;
}

rv = round(rv);

process.stdout.write(String(rv));
if(process.stdout.isTTY) { process.stdout.write('\n'); }
process.exit(0);