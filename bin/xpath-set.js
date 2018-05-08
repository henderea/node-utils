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
const args = require('../lib/arg-handler');

const {options, arg} = args()
    .addFlag('help', ['-h', '--help', 'help'])
    .addFlag('yes', ['-y', '--yes'])
    .parse();

if(arg.count < 3 && !options.help) {
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
${name('xpath-set')} ${opt('[-h|--help|help]')}
${name('xpath-set')} ${opt('[-y|--yes]')} ${arg('XML_FILENAME')} ${arg('XPATH_EXPRESSION')} ${arg('NEW_VALUE')}

${section('FLAGS')}:
${opt('-h|--help|help')}   -> ${optional} display this help
${opt('-y|--yes')}         -> ${optional} automatically confirm the changes

${section('ARGS')}:
${arg('XML_FILENAME')}     -> the path to the XML file
${arg('XPATH_EXPRESSION')} -> the xpath expression pointing to the node to set the text content of
${arg('NEW_VALUE')}        -> the value to place at the node referenced by ${arg('XPATH_EXPRESSION')}`);
    process.exit(0);
}

const filepath = path.resolve(arg(0));
const data = fs.readFileSync(filepath, 'UTF-8');
const doc = new dom().parseFromString(data);
const evaluator = xpath.parse(arg(1));
var results = evaluator.evaluate({
    node: doc,
    caseInsensitive: true,
    allowAnyNamespaceForNoPrefix: true
});
if(!results || results.length == 0) {
    exit(1);
} else {
    _.each(results.nodes, (node) => {
        node.textContent = arg(2);
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