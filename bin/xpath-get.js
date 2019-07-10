#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const xpath = require('xpath');
const xmldom = require('xmldom');
const dom = xmldom.DOMParser;
const serializer = xmldom.XMLSerializer;
const _map = require('lodash/map');
const { style, styles } = require('../lib/common/util');
const { bold, underline, red, green, cyan } = styles;

const arg = require('arg');
const options = arg(
    {
        '--help': Boolean,
        '-h': '--help'
    },
    {
        permissive: true
    }
);

const helpText = `${bold('xpath-get')}
    Get a value from an XML file via xpath

${bold('Usage:')}
    xpath-get ${style(cyan.bright, underline)('<xml_filename>')} ${style(cyan.bright, underline)('<xpath_expression>')}

${bold('Flags:')}
    ${green.bright('-h')}, ${green.bright('--help')}    Display this help

${bold('Parameters:')}
    ${style(cyan.bright, underline)('<xml_filename>')}        The path to the XML file being examined
    ${style(cyan.bright, underline)('<xpath_expression>')}    The xpath expression pointing to the node/value to get
`;

if(options['--help']) {
    console.log(helpText);
    process.exit(0);
}

if(!options._ || options._.length < 2) {
    console.log(`${style(bold, red)('You did not provide enough arguments.')}

${helpText}`);
    process.exit(1);
}

options.xml_filename = path.resolve(options._[0]);
options.xpath_expression = options._[1];

const doc = new dom().parseFromString(fs.readFileSync(path.resolve(options.xml_filename), 'UTF-8'));
let xpath_expression = options.xpath_expression.replace(/\/([\w\d]+)(?=$|\/)/g, "/*[local-name(.)='$1']");
const evaluator = xpath.parse(xpath_expression);
const results = evaluator.evaluate({
    node: doc,
    caseInsensitive: true,
    allowAnyNamespaceForNoPrefix: true
});
if(!results || results.length == 0) {
    process.exit(1);
} else {
    const ser = new serializer();
    console.log(_map(results.nodes, (r) => ser.serializeToString(r)).join('\n'));
}