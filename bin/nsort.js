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
const detectCharacterEncoding = require('detect-character-encoding');
const iconv = require('iconv-lite');

const readAll = async (stream) => {
    return new Promise((resolve, reject) => {
        var concatStream = concat((buffer) => {
            let encodingResult = detectCharacterEncoding(buffer);
            let encoding = encodingResult ? encodingResult.encoding : 'utf8';
            process.stderr.write(`Using: ${encoding}\n`);
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
    let sortedLines = orderBy(lines);
    if(args['--reverse']) { sortedLines = sortedLines.reverse(); }
    process.stdout.write(sortedLines.join('\n'));
    if(endedInNewLine) { process.stdout.write('\n'); }
    process.exit(0);
}

run();