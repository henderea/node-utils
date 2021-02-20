#!/usr/bin/env node

const { argParser } = require('@henderea/arg-helper')(require('arg'));
const { HelpTextMaker, styles, style } = require('@henderea/simple-colors/helpText');
const { magenta, red, green, bold } = styles;

const helpText = new HelpTextMaker('my-math')
    .wrap()
    .title.nl
    .pushWrap(4)
    .tab.text('A tool for doing some simple mathematical operations on the arguments.').nl
    .popWrap()
    .nl
    .usage.nl
    .pushWrap(4)
    .tab.name.space.flag('[flags]').space.param('...args').nl
    .popWrap()
    .nl
    .flags.nl
    .pushWrap(8)
    .dict
    .key.tab.flag('--count', '-C').value.text('Output a count of the numerical arguments').end.nl
    .key.tab.flag('--sum', '-s').value.text('Output a sum of the numerical arguments').end.nl
    .key.tab.flag('--avg', '-a').value.text('Output an average of the numerical arguments').end.nl
    .key.tab.flag('--min', '-m').value.text('Output the minimum of the numerical arguments').end.nl
    .key.tab.flag('--max', '-M').value.text('Output the maximum of the numerical arguments').end.nl
    .nl
    .key.tab.flag('--round', '-r').value.text('Round the result before outputting it').end.nl
    .key.tab.flag('--ceil', '-c').value.text('Round the result ').bold('up').text(' before outputting it').end.nl
    .key.tab.flag('--floor', '-f').value.text('Round the result ').bold('down').text(' before outputting it').end.nl
    .nl
    .key.tab.flag('--help', '-h').value.text('Print this help').end.nl
    .end
    .popWrap()
    .nl
    .bold('NOTES:').nl
    .ul
    .tab.li.text('You can specify one of the operations (count/sum/avg/min/max) and one of the rounding methods (round/ceil/floor).').nl
    .tab.li.text('If you do not provide an operation, it will default to sum.').nl
    .tab.li.text('If you do not provide a rounding method, it will not perform rounding.').nl
    .tab.li.text('When providing multiple operations or rounding methods, only one will be picked.').nl
    .tab.tab.li.text('The priority is based on the order above. So specifying both count and sum will use count.').nl
    .tab.li.text('If you do not provide any numerical arguments, the output will be a hyphen, unless you are using count mode, in which case it will be 0.')
    .end
    .nl
    .toString(120);

let options = null;
try {
    options = argParser()
        .bool('count', '--count', '-C')
        .bool('sum', '--sum', '-s')
        .bool('avg', '--avg', '-a')
        .bool('min', '--min', '-m')
        .bool('max', '--max', '-M')
        .bool('round', '--round', '-r')
        .bool('ceil', '--ceil', '-c')
        .bool('floor', '--floor', '-f')
        .help(helpText, '--help', '-h')
        .argv;
} catch(e) {
    console.error(red.bright(`${bold('Error in arguments:')} ${e.message}`));
    process.exit(1);
}

function getOp(options) {
    const count = items => items.length;
    const sum = items => items.reduce((s, i) => s + i, 0);
    const avg = items => sum(items) / count(items);
    const min = items => Math.min(...items);
    const max = items => Math.max(...items);

    if(options.count) { return count; }
    if(options.sum) { return sum; }
    if(options.avg) { return avg; }
    if(options.min) { return min; }
    if(options.max) { return max; }
    return sum;
}

function getRound(options) {
    const noop = v => v;
    const round = v => Math.round(v);
    const ceil = v => Math.ceil(v);
    const floor = v => Math.floor(v);

    if(options.round) { return round; }
    if(options.ceil) { return ceil; }
    if(options.floor) { return floor; }
    return noop;
}

function processOpts(options) {
    const op = getOp(options);
    const round = getRound(options);
    const items = options._.map(i => parseFloat(i)).filter(i => !Number.isNaN(i));
    return { op, round, items };
}

function exec(func, options) {
    const rv = func(options);
    let output;
    let code;
    if(Array.isArray(rv) && rv.length == 2) {
        output = rv[0];
        code = rv[1];
    } else {
        output = rv;
        code = 0;
    }
    process.stdout.write(String(output));
    if(process.stdout.isTTY) { process.stdout.write('\n'); }
    process.exit(code);
}

exec(options => {
    const { op, round, items } = processOpts(options);
    if(items.length == 0  && !options.count) { return ['-', 1]; }
    return round(op(items));
}, options);