#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

import xpath from 'xpath';
import xmldom from 'xmldom';
const dom = xmldom.DOMParser;
const serializer = xmldom.XMLSerializer;

import { HelpTextMaker, style, styles } from '@henderea/simple-colors/helpText.js';
const { bold, red } = styles;

import { readAll } from '../lib/utils/readAll.mjs';

import arg from 'arg';
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
  .key.tab.param('<xml_filename>').value.text(`The path to the XML file being examined. Use '-' to read from stdin.`).end.nl
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

options.xml_filename = options._[0];
options.xpath_expression = options._[1];

async function readFile(file) {
  if(file == '-') {
    return await readAll(process.stdin);
  } else if(fs.existsSync(path.resolve(file))) {
    return fs.readFileSync(path.resolve(file), 'utf8');
  } else {
    return null;
  }
}

async function run(options) {
  const fileData = await readFile(options.xml_filename);
  const doc = new dom().parseFromString(fileData);
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
  process.exit(0);
}

run(options);
