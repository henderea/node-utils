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
const { bold, red, green } = styles;
const { HelpTextMaker } = require('@henderea/simple-colors/helpText');

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

const helpText = new HelpTextMaker('xpath-set')
    .wrap()
    .title.nl
    .pushWrap(4)
    .tab.text('Set the text content of a node in an XML file via xpath').nl
    .popWrap()
    .nl
    .usage.nl
    .pushWrap(8)
    .tab.name.space.param('<xml_filename>').space.param('<xpath_expression>').space.param('<new_value>').nl
    .popWrap()
    .nl
    .flags.nl
    .pushWrap(8)
    .dict
    .key.tab.flag('-h', '--help').value.text('Display this help').end.nl
    .key.tab.flag('-y', '--yes').value.text('Automatically confirm the changes').end.nl
    .endDict
    .popWrap()
    .nl
    .params.nl
    .pushWrap(8)
    .dict
    .key.tab.param('<xml_filename>').value.text('The path to the XML file being modified').end.nl
    .key.tab.param('<xpath_expression>').value.text('The xpath expression pointing to the node to set the text content of').end.nl
    .key.tab.param('<new_value>').value.text('The value to place at the node referenced by ').param('xpath_expression').end.nl
    .endDict
    .popWrap()
    .nl
    .toString();

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
        process.exit(0);
    });
}