#!/usr/bin/env node

// process.stdin.setEncoding('utf8');

const mappings = [
    [/(\u00E2\u0080\u00A6?)/g, '...'],
    [/(\u00C2?\u00AB)/g, '«'],
    [/(\u00C2?\u00BB)/g, '»'],
    [/(\u00C2\u00A0)/g, ''],
    [/([\u00C0\u00C1\u00C2\u00C3\u00C4\u00C5\u0100\u0102\u0104])/g, 'A'],
    [/([\u00E0\u00E1\u00E2\u00E3\u00E4\u00E5\u0101\u0103\u0105])/g, 'a'],
    [/([\u00C6])/g, 'AE'],
    [/([\u00E6])/g, 'ae'],
    [/([\u00C7\u0106\u0108\u010A\u010C])/g, 'C'],
    [/([\u00E7\u0107\u0109\u010B\u010D])/g, 'c'],
    [/([\u010E\u0110])/g, 'D'],
    [/([\u010F\u0111])/g, 'd'],
    [/([\u00C8\u00C9\u00CA\u00CB\u0112\u0114\u0116\u0118\u011A])/g, 'E'],
    [/([\u00E8\u00E9\u00EA\u00EB\u0113\u0115\u0117\u0119\u011B])/g, 'e'],
    [/([\u011C\u011E\u0120\u0122])/g, 'G'],
    [/([\u011D\u011F\u0121\u0123])/g, 'g'],
    [/([\u0124\u0126])/g, 'H'],
    [/([\u0125\u0127])/g, 'h'],
    [/([\u00CC\u00CD\u00CE\u00CF\u0128\u012A\u012C\u012E\u0130])/g, 'I'],
    [/([\u00EC\u00ED\u00EE\u00EF\u0129\u012B\u012D\u012F\u0131])/g, 'i'],
    [/([\u0132])/g, 'IJ'],
    [/([\u0133])/g, 'ij'],
    [/([\u0134])/g, 'J'],
    [/([\u0135])/g, 'j'],
    [/([\u0136])/g, 'K'],
    [/([\u0137])/g, 'k'],
    [/([\u0139\u013B\u013D\u013F\u0141])/g, 'L'],
    [/([\u013A\u013C\u013E\u0140\u0142])/g, 'l'],
    [/([\u00D1\u0143\u0145\u0147\u014A])/g, 'N'],
    [/([\u00F1\u0144\u0146\u0148\u0149\u014B])/g, 'n'],
    [/([\u00D2\u00D3\u00D4\u00D5\u00D6\u00D8\u014C\u014E\u0150])/g, 'O'],
    [/([\u00F2\u00F3\u00F4\u00F5\u00F6\u00F8\u014D\u014F\u0151])/g, 'o'],
    [/([\u0152])/g, 'OE'],
    [/([\u0153])/g, 'oe'],
    [/([\u0154\u0156\u0158])/g, 'R'],
    [/([\u0155\u0157\u0159])/g, 'r'],
    [/([\u015A\u015C\u015E\u0160])/g, 'S'],
    [/([\u015B\u015D\u015F\u0161])/g, 's'],
    [/([\u0162\u0164\u0166])/g, 'T'],
    [/([\u0163\u0165\u0167])/g, 't'],
    [/([\u00D9\u00DA\u00DB\u00DC\u0168\u016A\u016C\u016E\u0170\u0172])/g, 'U'],
    [/([\u00F9\u00FA\u00FB\u00FC\u0169\u016B\u016D\u016F\u0171\u0173])/g, 'u'],
    [/([\u0174])/g, 'W'],
    [/([\u0175])/g, 'w'],
    [/([\u00D7])/g, 'x'],
    [/([\u00DD\u0176\u0178])/g, 'Y'],
    [/([\u00FD\u00FF\u0177])/g, 'y'],
    [/([\u0179\u017B\u017D])/g, 'Z'],
    [/([\u017A\u017C\u017E])/g, 'z'],
    [/([\u201C\u201D])/g, '"'],
    [/([\u00B4\u2018\u2019\u0092])/g, "'"],
    [/([\u2010\u2011\u2012\u2013\u2014\u2015])/g, '-'],
    [/([\u2026])/g, '...']
];

const stripAccents = (str) => mappings.reduce((s, e) => s.replace(e[0], e[1]), str);

const concat = require('concat-stream');
const detectCharacterEncoding = require('detect-character-encoding');
const iconv = require('iconv-lite');

const readAll = async (stream) => {
    return new Promise((resolve, reject) => {
        var concatStream = concat({ encoding: 'buffer' }, (buffer) => {
            if(!buffer || buffer.length <= 0) { resolve(''); }
            let encodingResult = null;
            try {
                encodingResult = detectCharacterEncoding(buffer);
            } catch { }
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
    process.stdout.write(stripAccents(input));
}

run();

// process.stdin.on('readable', () => {
//     const chunk = process.stdin.read();
//     if(chunk !== null) {
//         process.stdout.write(stripAccents(chunk));
//     }
// });