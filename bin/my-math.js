#!/usr/bin/env node

const { argParser } = require('@henderea/arg-helper')(require('arg'));
const { HelpTextMaker, styles, style } = require('@henderea/simple-colors/helpText');
const { magenta, red, green, bold } = styles;
const _round = require('lodash/round');
const _floor = require('lodash/floor');
const _ceil = require('lodash/ceil');

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
    .key.tab.flag('--places', '-p').value.text('Round to a specific number of places').end.nl
    .nl
    .key.tab.flag('--format', '--to', '-t').value.text('Format the value in a specific way. Supports byte formatting. Use lower case for base 1000, upper case for base 1024. Use ').bold(magenta('h')).text('/').bold(magenta('H')).text(' for automatic selection, or ').bold(magenta('b')).text('/').bold(magenta('B')).text('/').bold(magenta('k')).text('/').bold(magenta('K')).text('/').bold(magenta('m')).text('/').bold(magenta('M')).text('/').bold(magenta('g')).text('/').bold(magenta('G')).text('/').bold(magenta('t')).text('/').bold(magenta('T')).text(' for a specific unit. You can also add a number to the end of the format key to specify the maximum number of decimal places (i.e. "').flag('--format').text(' ').bold(magenta('h0')).text('" or "').flag('--format').text(' ').bold(magenta('m4')).text('"). If not specified, the default of 2 decimal places will be used. Note that this decimal place setting does not affect values that are in bytes.').end.nl
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
        .string('format', '--format', '--to', '-t')
        .number('places', '--places', '-p')
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
    const places = options.places || 0;
    const noop = v => v;
    const round = v => _round(v, places);
    const ceil = v => _ceil(v, places);
    const floor = v => _floor(v, places);

    if(options.round) { return round; }
    if(options.ceil) { return ceil; }
    if(options.floor) { return floor; }
    return noop;
}

function getFormat(options) {
    const upperMatch = ['H', '', 'K', 'M', 'G', 'T'];
    const lowerMatch = ['h', '', 'k', 'm', 'g', 't'];
    const upperUnits = upperMatch.slice(1);
    const lowerUnits = lowerMatch.slice(1);

    let formatSize = (size, unitIndex, units, factor, digits) => {
        if(unitIndex < 0) {
            if(Math.abs(size) < 1) {
                unitIndex = 0;
            } else {
                unitIndex = Math.floor(Math.log(Math.abs(size)) / Math.log(factor));
            }
        }
        if(unitIndex < 0) {
            unitIndex = 0;
        }
        if(unitIndex >= units.length) {
            unitIndex = units.length - 1;
        }
        let unit = units[unitIndex];
        if(unitIndex == 0) {
            return `${Math.floor(size)} ${unit}B`
        } else {
            return `${(size / Math.pow(factor, unitIndex)).toLocaleString('en-US', { maximumFractionDigits: digits })} ${unit}B`;
        }
    };
    if(!options.format || options.format == '') { return v => v; }
    let matches = /^([hbkmgt])(\d+)?$/i.exec(options.format);
    if(!matches) { return v => v; }
    let u = matches[1];
    let d = parseInt(matches[2]);
    if(Number.isNaN(d)) { d = 2; }
    if(['b', 'B'].indexOf(u) >= 0) {
        return v => `${v} B`;
    }
    if(upperMatch.indexOf(u) >= 0) {
        const unitInd = upperMatch.indexOf(u) - 1;
        return v => formatSize(v, unitInd, upperUnits, 1024.0, d);
    }
    if(lowerMatch.indexOf(u) >= 0) {
        const unitInd = lowerMatch.indexOf(u) - 1;
        return v => formatSize(v, unitInd, lowerUnits, 1000.0, d);
    }
    return v => v;
}

const concat = require('concat-stream');
const jschardet = require('jschardet');
const iconv = require('iconv-lite');

const readAll = async (stream) => {
    return new Promise((resolve, reject) => {
        var concatStream = concat({ encoding: 'buffer' }, (buffer) => {
            if(!buffer || buffer.length <= 0) { resolve(''); }
            let encodingResult = null;
            try {
                encodingResult = jschardet.detect(buffer);
            } catch { }
            let encoding = (encodingResult && encodingResult.encoding) ? encodingResult.encoding : 'utf8';
            resolve(iconv.decode(buffer, encoding));
        });
        stream.on('error', reject);
        stream.pipe(concatStream);
    });
};

async function processOpts(options) {
    const op = getOp(options);
    const round = getRound(options);
    const format = getFormat(options);
    const items = options._.map(i => parseFloat(i)).filter(i => !Number.isNaN(i));
    if(!process.stdin.isTTY) {
        const inp = await readAll(process.stdin);
        const inpItems = inp.split(/\r?\n/g).map(i => parseFloat(i)).filter(i => !Number.isNaN(i));
        items.push(...inpItems);
    }
    return { op, round, format, items };
}

async function exec(func, options) {
    const rv = await func(options);
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

exec(async options => {
    const { op, round, format, items } = await processOpts(options);
    if(items.length == 0 && !options.count) { return ['-', 1]; }
    return format(round(op(items)));
}, options);