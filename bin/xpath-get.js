#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const xpath = require('xpath');
const xmldom = require('xmldom');
const dom = xmldom.DOMParser;
const serializer = xmldom.XMLSerializer;
const _ = require('lodash');

let firstArg = 2;

let arg = ind => process.argv[firstArg + ind];

const allowedFlags = {'-h': 'help', '--help': 'help', 'help': 'help'};

let options = {};

while(arg(0) && _.includes(_.keys(allowedFlags), arg(0))) {
    options[allowedFlags[arg(0)]] = true;
    firstArg++;
}

if(!arg(1) && !options.help) {
    console.log('Not enough arguments.');
    options.help = true;
}

if(options.help) {
    console.log(`usage:
xpath-get [-h|--help|help]
xpath-get XML_FILENAME XPATH_EXPRESSION

flags:
-h|--help|help -> display this help`);
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