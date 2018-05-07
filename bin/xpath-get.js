#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const xpath = require('xpath');
const xmldom = require('xmldom');
const dom = xmldom.DOMParser;
const serializer = xmldom.XMLSerializer;
const _ = require('lodash');

// console.log(path.resolve(process.argv[2]));
// console.log(fs.readFileSync(path.resolve(process.argv[2]), 'UTF-8'));

const doc = new dom().parseFromString(fs.readFileSync(path.resolve(process.argv[2]), 'UTF-8'));
// console.log(doc);
// console.log(doc);
// console.log(process.argv[3]);
const evaluator = xpath.parse(process.argv[3]);
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