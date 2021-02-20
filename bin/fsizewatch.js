#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const moment = require('moment-timezone');
const { argParser } = require('@henderea/arg-helper')(require('arg'));
const { HelpTextMaker, styles, style } = require('@henderea/simple-colors/helpText');
const { magenta, red, green, bold } = styles;

const ex = magenta.bright;

const helpText = new HelpTextMaker('fsizewatch')
    .wrap()
    .title.nl
    .pushWrap(4)
    .tab.text('A tool for watching the change in size of a single file, or of the files in a directory.').nl
    .popWrap()
    .nl
    .flags.nl
    .pushWrap(8)
    .dict
    .key.tab.flag('--target', '-t').value.text('The file or directory to watch').end.nl
    .key.tab.flag('--format', '-f').value.text('The format to use for displaying. See ').bold('FORMATTING').text(' for format syntax').end.nl
    .key.tab.flag('--human-sizes', '-h').value.text('Display sizes in human-readable units').end.nl
    .key.tab.flag('--kilobyte', '-k').value.text('Display sizes in kilobytes').end.nl
    .key.tab.flag('--megabyte', '-m').value.text('Display sizes in megabytes').end.nl
    .key.tab.flag('--poll', '-p').value.text('Use polling instead of fs-events on mac').end.nl
    .key.tab.flag('--poll-interval', '-i').value.text('The polling interval in milliseconds. Defaults to 1000 ms').end.nl
    .key.tab.flag('--help').value.text('Print this help').end.nl
    .endDict
    .popWrap()
    .nl
    .bold('FORMATTING:').nl
    .pushWrap(4)
    .tab.text(`You can specify the output format. The default value is '%t - %s - %f' when a directory is being watched, and '%t - %s' when a file is being watched.`).nl
    .popWrap()
    .nl
    .pushWrap(8)
    .dict
    .tab.bold('Placeholders:').nl
    .key.tab.tab.text(ex('%t')).value.text(`The time the change was detected. Formatted as '2020-01-01 13:00:00'`).end.nl
    .key.tab.tab.text(ex('%s')).value.text(`The size of the file after the change`).end.nl
    .key.tab.tab.text(ex('%f')).value.text(`The file path, relative to the directory that is being watched. If used when watching an individual file, shows the absolute path`).end.nl
    .key.tab.tab.text(ex('%F')).value.text(`The absolute file path`).end.nl
    .key.tab.tab.text(ex('%%')).value.text(`A literal percent sign`).end.nl
    .endDict
    .popWrap()
    .nl
    .toString(125);

let options = null;
try {
    options = argParser()
        .string('target', '--target', '-t')
        .string('format', '--format', '-f')
        .bool('humanSizes', '--human-sizes', '-h')
        .bool('kilobyte', '--kilobyte', '-k')
        .bool('megabyte', '--megabyte', '-m')
        .bool('poll', '--poll', '-p')
        .number('pollInterval', '--poll-interval', '-i')
        .help(helpText, '--help')
        .argv;
} catch(e) {
    console.error(red.bright(`${bold('Error in arguments:')} ${e.message}`));
    process.exit(1);
}

if(!options.target || !fs.existsSync(path.resolve(options.target))) {
    console.error(style(red.bright, bold)('You must specify a valid target'));
    process.exit(1);
}

let target = path.resolve(options.target);
let isFile = fs.statSync(target).isFile();

let format = options.format;
let formatMissing = !format;
let formatInvalidPlaceholders = format && format.match(/%+[^%fFts]/g).filter(p => (p.replace(/[^%]/g, '').length % 2) != 0).map(p => p.slice(-2));
let formatInvalidPlaceholder = formatInvalidPlaceholders && formatInvalidPlaceholders.length > 0;
let formatHasPlaceholder = format && /%[fFts]/.test(format);
if(formatMissing || formatInvalidPlaceholder || !formatHasPlaceholder) {
    format = isFile ? '%t - %s' : '%t - %s - %f';
    if(!formatMissing) {
        if(formatInvalidPlaceholder) {
            console.error(red.bright(`${bold('Error in format:')} Invalid placeholder(s): '${formatInvalidPlaceholders.join(`', '`)}'`));
            console.error(red.dim(`Using default format '${format}'`));
        } else if(!formatHasPlaceholder) {
            console.error(red.bright(`${bold('Error in format:')} No valid placeholders found`));
            console.error(red.dim(`Using default format '${format}'`));
        }
    }
}

let unitIndex = 0;

if(options.humanSizes) {
    unitIndex = -1;
} else if(options.kilobyte) {
    unitIndex = 1;
} else if(options.megabyte) {
    unitIndex = 2;
}

let units = ['B', 'KB', 'MB', 'GB', 'TB'];

let formatSize = (size) => {
    let unitInd = unitIndex;
    if(unitInd < 0) {
        if(Math.abs(size) < 1) {
            unitInd = 0;
        } else {
            unitInd = Math.floor(Math.log(Math.abs(size)) / Math.log(1024));
        }
    }
    if(unitInd < 0) {
        unitInd = 0;
    }
    if(unitInd >= units.length) {
        unitInd = units.length - 1;
    }
    let unit = units[unitInd];
    if(unitInd == 0) {
        return `${Math.floor(size)} ${unit}`
    } else {
        return `${(size / Math.pow(1024, unitInd)).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unit}`;
    }
};

let applyFormat = (p, size, momentDate) => {
    let fullPath = path.resolve(p);
    let relativePath = isFile ? fullPath : path.relative(target, fullPath);
    let dateString = momentDate.format('YYYY-MM-DD HH:mm:ss');
    let sizeString = formatSize(size);
    return format.replace(/(%+)([%fFst])/g, (m, percents, type) => {
        let value = null;
        if(type == '%') {
            value = '%';
        } else if(type == 'f') {
            value = relativePath;
        } else if(type == 'F') {
            value = fullPath;
        } else if(type == 's') {
            value = sizeString;
        } else if(type == 't') {
            value = dateString;
        } else {
            value = type;
        }
        if(percents.length > 1) {
            value = `${'%'.repeat(Math.floor((percents - 1) / 2))}${value}`;
        }
        return value;
    });
};

let latestSizes = {};

let printInfo = (p) => {
    let size = fs.statSync(path.resolve(p)).size;
    let sizeString = formatSize(size);
    if(latestSizes[p] != sizeString) {
        latestSizes[p] = sizeString;
        console.log(applyFormat(p, size, moment()));
    }
};

let usePolling = !!options.poll;

let interval = options.pollInterval || 1000;

let watcher = chokidar.watch(target, {
    ignoreInitial: !isFile,
    usePolling,
    interval
});
watcher.on('add', printInfo);
watcher.on('change', printInfo);

process.on('SIGINT', async () => {
    await watcher.close();
    console.log();
    process.exit(0);
});