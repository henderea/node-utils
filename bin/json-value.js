#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const { argParser } = require('@henderea/arg-helper')(require('arg'));
const { HelpTextMaker, styles } = require('@henderea/simple-colors/helpText');
const { red, bold } = styles;

const ttys = require('ttys');

const { readAll } = require('../lib/utils/readAll');
const { natSort } = require('../lib/utils/natSort');
const __ = require('../lib/utils/common.js');

const helpText = new HelpTextMaker('json-value')
  .wrap()
  .title.nl
  .pushWrap(4)
  .tab.text('A tool for extracting data from JSON').nl
  .popWrap()
  .nl
  .usage.nl
  .pushWrap(4)
  .tab.name.space.flag('[flags]').space.param('...files').nl
  .popWrap()
  .nl
  .flags.nl
  .pushWrap(8)
  .dict
  .key.tab.flag('--get', '-g').value.text('Get the data at a specific path from the JSON.').end.nl
  .key.tab.flag('--interactive', '-i').value.text('Load the file(s) in interactive mode. Type the command \\? to see usage information.').end.nl
  .key.tab.flag('--no-format', '-F').value.text('Print the JSON without indentation. Otherwise, it will indent the output.').end.nl
  .key.tab.flag('--literal', '-l').value.text('When the result is a single value and not a object or array, print it out as-is.').end.nl
  .key.tab.flag('--indent-spaces', '--spaces', '-s').value.text('The number of spaces to indent by when using ').flag('--format', '-f').text('. Defaults to 2.').end.nl
  .end
  .popWrap()
  .nl
  .bold('NOTES:').nl
  .ul
  .tab.li.text('You can pass the filename "-" to read from stdin.').nl
  .tab.li.text('The path separator is "->".')
  .end
  .nl
  .toString(120);

let options = null;
try {
  options = argParser()
    .string('get', '--get', '-g')
    .bool('interactive', '--interactive', '-i')
    .bool('noFormat', '--no-format', '-F')
    .bool('literal', '--literal', '-l')
    .number('indentSpaces', '--indent-spaces', '--spaces', '-s')
    .help(helpText, '--help', '-h')
    .argv;
} catch (e) {
  console.error(red.bright(`${bold('Error in arguments:')} ${e.message}`));
  process.exit(1);
}

async function readFile(file) {
  if(file == '-') {
    return await readAll(process.stdin);
  } else if(fs.existsSync(file)) {
    return fs.readFileSync(file);
  } else {
    return null;
  }
}

async function readFiles(fileNames) {
  return __.compact(await __.mapAsync(fileNames, async (file) => {
    const d = await readFile(file);
    if(!d || __.isBlank(d)) { return false; }
    try {
      return { file, data: JSON.parse(d) };
    } catch (e) {
      console.error(red.bright(`${bold(`Error parsing JSON for file '${file}':`)} ${e.message}`));
      return false;
    }
  }));
}

function resolvePath(pathPieces, curData) {
  if(!pathPieces || pathPieces.length == 0) {
    return curData;
  }
  let piece = pathPieces[0];
  const subPieces = pathPieces.slice(1);
  if(__.isArray(curData)) {
    if(piece == '*') {
      return curData.map((v) => resolvePath(subPieces, v));
    }
    piece = parseInt(String(piece));
    const subData = __.getAtIndex(curData, piece);
    if(__.isUndefined(subData)) {
      return curData;
    }
    return resolvePath(subPieces, subData);
  }
  if(__.isObject(curData)) {
    if(piece == '*') {
      return Object.values(curData).map((v) => resolvePath(subPieces, v));
    }
    piece = String(piece);
    if(__.hasKey(curData, piece)) {
      return resolvePath(subPieces, curData[piece]);
    }
    return curData;
  }
  return curData;
}

function getSuggestions(pathPieces, data, printChildren = false) {
  if(pathPieces.includes('*')) {
    return null;
  } else {
    const lastPiece = __.last(pathPieces);
    const fullPieces = pathPieces.slice(0, -1);
    const curData = resolvePath(fullPieces, data);
    if(__.isArray(curData)) {
      const list = natSort(__.times(curData.length, String));
      if(__.isBlank(lastPiece)) {
        return list;
      }
      if(list.includes(lastPiece) && printChildren) {
        return getSuggestions(__.concat([], pathPieces, null), data);
      }
      return list.filter((e) => String(e).startsWith(lastPiece));
    }
    if(__.isObject(curData)) {
      const list = natSort(Object.keys(curData));
      if(__.isBlank(lastPiece)) {
        return list;
      }
      if(list.includes(lastPiece) && printChildren) {
        return getSuggestions(__.concat([], pathPieces, null), data);
      }
      return list.filter((e) => String(e).startsWith(lastPiece));
    }
    return null;
  }
}

function printJson(data, options) {
  if(options.literal && !__.isArray(data) && !__.isObject(data)) {
    console.log(String(data));
  } else if(options.noFormat) {
    console.log(JSON.stringify(data));
  } else {
    const spaces = options.indentSpaces || 2;
    console.log(JSON.stringify(data, undefined, spaces));
  }
}

function createReadlineInterface(data) {
  const rl = readline.createInterface({
    input: ttys.stdin,
    output: ttys.stdout,
    prompt: '>> ',
    tabSize: 4,
    completer: () => {
      const line = rl.line.replace(/^\\d\s*/, '');
      const pathPieces = line.split(/->/g);
      const lastPiece = __.last(pathPieces);
      const suggestions = getSuggestions(pathPieces, data) || [];
      return [suggestions, lastPiece];
    }
  });
  return rl;
}

async function prompt(rl) {
  return new Promise((resolve) => {
    rl.question('>> ', resolve);
  });
}

const interactiveHelpText = new HelpTextMaker('')
  .wrap()
  .pushWrap(4)
  .dict
  .key.flag('<path>').value.text('get the value at ').flag('<path>').text(`, where the path separator is '->'`).end.nl
  .key.flag('\\q').value.text('exit').end.nl
  .key.flag('\\h', '\\?').value.text('print this help').end.nl
  .key.flag('\\d').text(' ').param('<path>').value.text('print the elements in ').param('<path>').end.nl
  .end
  .popWrap()
  .toString(120);

async function runInteractive(data, options) {
  const rl = createReadlineInterface(data);
  while(true) {
    const path = await prompt(rl);
    if(path == '\\q') {
      process.exit(0);
    } else if(path == '\\h' || path == '\\?') {
      console.log(interactiveHelpText);
    } else if(/^\\d\s*(.*)$/.test(path)) {
      const pathPieces = path.replace(/^\\d\s*(.*)$/, '$1').split(/->/g);
      const list = getSuggestions(pathPieces, data, true);
      if(list && list.length > 0) { console.log(list.join(', ')); }
    } else {
      const pathPieces = path.split(/->/g);
      const curData = resolvePath(pathPieces, data);
      printJson(curData, options);
    }
  }
}

async function run(options) {
  const fileData = await readFiles(options._);
  let data = fileData.map((d) => d.data);
  if(data.length == 0) {
    console.error(red.bright('No data found'));
    process.exit(1);
  }
  let singleFile = data.length == 1;
  if(singleFile) {
    data = data[0];
  }
  if(!__.isBlank(options.get)) {
    let pathPieces = options.get.split(/->/g);
    if(!singleFile) {
      pathPieces = __.concat(['*'], pathPieces);
    }
    const curData = resolvePath(pathPieces, data);
    printJson(curData, options);
    return;
  }
  if(options.interactive) {
    await runInteractive(data, options);
    return;
  }
  printJson(data, options);
}

run(options);
