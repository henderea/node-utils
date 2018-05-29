#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const xpath = require('xpath');
const xmldom = require('xmldom');
const dom = xmldom.DOMParser;
const serializer = xmldom.XMLSerializer;
const _ = require('lodash');
const jsdiff = require('diff');
const chalk = require('chalk');
const inquirer = require('inquirer');
const yargs = require('yargs');

const options = yargs
    .command('$0 <xml_filename> <xpath_expression> <new_value>', 'set the text content of a node in an xml file via xpath', yargs => {
        yargs.positional('xml_filename', {
            describe: 'the path to the XML file being modified',
            type: 'string',
            normalize: true
        }).positional('xpath_expression', {
            describe: 'the xpath expression pointing to the node to set the text content of',
            type: 'string'
        }).positional('new_value', {
            describe: 'the value to place at the node referenced by xpath_expression',
            type: 'string'
        })
            .alias('y', 'yes')
            .boolean('y')
            .describe('y', 'automatically confirm the changes');
    })
    .wrap(yargs.terminalWidth())
    .help('h')
    .alias('h', 'help')
    .argv;

const filepath = path.resolve(options.xml_filename);
const data = fs.readFileSync(filepath, 'UTF-8');
const doc = new dom().parseFromString(data);
const evaluator = xpath.parse(options.xpath_expression);
var results = evaluator.evaluate({
    node: doc,
    caseInsensitive: true,
    allowAnyNamespaceForNoPrefix: true
});
if(!results || results.length == 0) {
    exit(1);
} else {
    _.each(results.nodes, (node) => {
        node.textContent = options.new_value;
    });
    const newData = new serializer().serializeToString(doc);
    const diff = jsdiff.diffLines(data, newData);
    const hasChanges = _.some(diff, part => part.added || part.removed);
    if(!hasChanges) {
        console.log('No changes');
        process.exit(0);
    }
    console.log(_.compact(_.map(diff, (part) => {
        const color = part.added ? chalk.green : part.removed ? chalk.red : null;
        if(color) {
            return color(part.value.replace(/\n/g, ''));
        } else {
            return null;
        }
    })).join('\n'));
    var prompt = inquirer.createPromptModule();
    (options.yes ? Promise.resolve({save: true}) : prompt({
        type: 'confirm',
        name: 'save',
        message: 'Save the changes?',
        default: false
    })).then(answers => {
        if(answers.save) {
            fs.writeFileSync(filepath, newData);
        }
    })
}