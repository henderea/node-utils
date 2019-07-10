#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const xpath = require('xpath');
const xmldom = require('xmldom');
const dom = xmldom.DOMParser;
const serializer = xmldom.XMLSerializer;
const _compact = require('lodash/compact');
const jsdiff = require('diff');
const { style, styles } = require('@henderea/simple-colors');
const { bold, underline, red, green, cyan } = styles;

const arg = require('arg');
const options = arg(
    {
        '--help': Boolean,
        '-h': '--help',
        '--yes': Boolean,
        '-y': '--yes'
    },
    {
        permissive: true
    }
);

const helpText = `${bold('xpath-set')}
    Set the text content of a node in an XML file via xpath

${bold('Usage:')}
    xpath-set ${style(cyan.bright, underline)('<xml_filename>')} ${style(cyan.bright, underline)('<xpath_expression>')} ${style(cyan.bright, underline)('<new_value>')}

${bold('Flags:')}
    ${green.bright('-h')}, ${green.bright('--help')}    Display this help
    ${green.bright('-y')}, ${green.bright('--yes')}     Automatically confirm the changes

${bold('Parameters:')}
    ${style(cyan.bright, underline)('<xml_filename>')}        The path to the XML file being modified
    ${style(cyan.bright, underline)('<xpath_expression>')}    The xpath expression pointing to the node to set the text content of
    ${style(cyan.bright, underline)('<new_value>')}           The value to place at the node referenced by ${style(cyan.bright, underline)('xpath_expression')}
`;

if(options['--help']) {
    console.log(helpText);
    process.exit(0);
}

if(!options._ || options._.length < 3) {
    console.log(`${style(bold, red)('You did not provide enough arguments.')}

${helpText}`);
    process.exit(1);
}

options.yes = options['--yes'];
options.xml_filename = path.resolve(options._[0]);
options.xpath_expression = options._[1];
options.new_value = options._[2];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr
});

const askSave = async (yes) => {
    if(yes) return true;
    return new Promise((resolve, reject) => {
        rl.question(`${green('?')} ${bold('Save the changes? [y/N]')}`, response => {
            response = response.toLowerCase();
            if(response.length == 0) {
                resolve(false);
                return
            }
            if(response == 'y' || response == 'yes') {
                resolve(true);
                return
            }
            resolve(false);
        });
    });
};

const filepath = path.resolve(options.xml_filename);
const data = fs.readFileSync(filepath, 'UTF-8');
const doc = new dom().parseFromString(data);
let xpath_expression = options.xpath_expression.replace(/\/([\w\d]+)(?=$|\/)/g, "/*[local-name(.)='$1']");
const evaluator = xpath.parse(xpath_expression);
var results = evaluator.evaluate({
    node: doc,
    caseInsensitive: true,
    allowAnyNamespaceForNoPrefix: true
});
if(!results || results.length == 0) {
    process.exit(1);
} else {
    results.nodes.forEach((node) => {
        node.textContent = options.new_value;
    });
    const newData = new serializer().serializeToString(doc);
    const diff = jsdiff.diffLines(data, newData);
    const hasChanges = diff.some(part => part.added || part.removed);
    if(!hasChanges) {
        console.log('No changes');
        process.exit(0);
    }
    console.log(_compact(diff.map((part) => {
        const color = part.added ? green : part.removed ? red : null;
        if(color) {
            return color(part.value.replace(/\n/g, ''));
        } else {
            return null;
        }
    })).join('\n'));
    askSave(options.yes).then(save => {
        if(save) {
            fs.writeFileSync(filepath, newData);
        }
    });
}