#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const xpath = require('xpath');
const xmldom = require('xmldom');
const dom = xmldom.DOMParser;
const serializer = xmldom.XMLSerializer;
const { style, styles } = require('@henderea/simple-colors');
const { bold, red } = styles;
const { HelpTextMaker } = require('@henderea/simple-colors/helpText');

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

const helpText = new HelpTextMaker('xpath-get')
  .wrap()
  .title.nl
  .pushWrap(4)
  .tab.text('Get a value from an XML file via xpath').nl
  .popWrap()
  .nl
  .usage.nl
  .pushWrap(8)
  .tab.name.space.param('<xml_filename>').space.param('<xpath_expression>').nl
  .popWrap()
  .nl
  .flags.nl
  .pushWrap(8)
  .dict
  .key.tab.flag('-h', '--help').value.text('Display this help').end.nl
  .endDict
  .popWrap()
  .nl
  .params.nl
  .pushWrap(8)
  .dict
  .key.tab.param('<xml_filename>').value.text('The path to the XML file being examined').end.nl
  .key.tab.param('<xpath_expression>').value.text('The xpath expression pointing to the node/value to get').end.nl
  .endDict
  .popWrap()
  .nl
  .toString();

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
  console.log(results.nodes.map((r) => ser.serializeToString(r)).join('\n'));
}
