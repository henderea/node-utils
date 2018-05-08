#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const xpath = require('xpath');
const xmldom = require('xmldom');
const dom = xmldom.DOMParser;
const serializer = xmldom.XMLSerializer;
const _ = require('lodash');
const chalk = require('chalk');
const args = require('../lib/arg-handler');

const {options, arg} = args()
    .addFlag('help', ['-h', '--help', 'help'])
    .parse();

if(arg.count < 2 && !options.help) {
    console.log('Not enough arguments.');
    options.help = true;
}

if(options.help) {
    const arg = chalk.underline.blue;
    const opt = chalk.underline.gray;
    const optional = chalk.gray('(optional)');
    const section = chalk.bold.underline;
    const name = chalk.bold.green;
    console.log(`${section('USAGE')}:
${name('xpath-get')} ${opt('[-h|--help|help]')}
${name('xpath-get')} ${arg('XML_FILENAME')} ${arg('XPATH_EXPRESSION')}

${section('FLAGS')}:
${opt('-h|--help|help')}   -> ${optional} display this help

${section('ARGS')}:
${arg('XML_FILENAME')}     -> the path to the XML file
${arg('XPATH_EXPRESSION')} -> the xpath expression pointing to the node/value to get`);
    process.exit(0);
}

const doc = new dom().parseFromString(fs.readFileSync(path.resolve(arg(0)), 'UTF-8'));
const evaluator = xpath.parse(arg(1));
const results = evaluator.evaluate({
    node: doc,
    caseInsensitive: true,
    allowAnyNamespaceForNoPrefix: true
});
if(!results || results.length == 0) {
    exit(1);
} else {
    const ser = new serializer();
    console.log(_.map(results.nodes, (r) => ser.serializeToString(r)).join('\n'));
}