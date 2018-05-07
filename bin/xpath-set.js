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

// console.log(path.resolve(process.argv[2]));
// console.log(fs.readFileSync(path.resolve(process.argv[2]), 'UTF-8'));
const filepath = path.resolve(process.argv[2]);
const data = fs.readFileSync(filepath, 'UTF-8');
const doc = new dom().parseFromString(data);
// console.log(doc);
// console.log(doc);
// console.log(process.argv[3]);
const evaluator = xpath.parse(process.argv[3]);
var results = evaluator.evaluate({
    node: doc,
    caseInsensitive: true,
    allowAnyNamespaceForNoPrefix: true
});
if(!results || results.length == 0) {
    exit(1);
} else {
    _.each(results.nodes, (node) => {
        node.textContent = process.argv[4];
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
    prompt({
        type: 'confirm',
        name: 'save',
        message: 'Save the changes?',
        default: false
    }).then(answers => {
        if(answers.save) {
            fs.writeFileSync(filepath, newData);
        }
    })
}