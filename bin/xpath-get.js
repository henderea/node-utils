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
const yargs = require('yargs');

const options = yargs
    .command('$0 <xml_filename> <xpath_expression>', 'get a value from an xml file via xpath', yargs => {
        yargs.positional('xml_filename', {
            describe: 'the path to the XML file being examined',
            type: 'string',
            normalize: true
        }).positional('xpath_expression', {
            describe: 'the xpath expression pointing to the node/value to get',
            type: 'string'
        });
    })
    .wrap(yargs.terminalWidth())
    .help('h')
    .alias('h', 'help')
    .argv;

const doc = new dom().parseFromString(fs.readFileSync(path.resolve(options.xml_filename), 'UTF-8'));
const evaluator = xpath.parse(options.xpath_expression);
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