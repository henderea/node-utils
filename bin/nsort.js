#!/usr/bin/env node

const arg = require('arg');
const { orderBy } = require('natural-orderby');

const args = arg(
    {
        '--reverse': Boolean,
        '-rc': '--reverse'
    },
    {
        permissive: true
    }
);

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
            let encoding = encodingResult ? encodingResult.encoding : 'utf8';
            resolve(iconv.decode(buffer, encoding));
        });
        stream.on('error', reject);
        stream.pipe(concatStream);
    });
};

const run = async () => {
    let input = await readAll(process.stdin);
    let trimmedInput = input.replace(/\n$/m, '');
    let endedInNewLine = trimmedInput != input;
    let lines = trimmedInput.split(/\n/g);
    let sortedLines = orderBy(lines, [v => v.replace(/[_-]/g, ' '), v => v]);
    if(args['--reverse']) { sortedLines = sortedLines.reverse(); }
    process.stdout.write(sortedLines.join('\n'));
    if(endedInNewLine) { process.stdout.write('\n'); }
    process.exit(0);
}

run();