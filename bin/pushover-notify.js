#!/usr/bin/env node

const Push = require('pushover-notifications');
const { argParser } = require('@henderea/arg-helper')(require('arg'));
const { HelpTextMaker, styles, style } = require('@henderea/simple-colors/helpText');
const { red, bold } = styles;

const helpText = new HelpTextMaker('pushover-notify')
  .wrap()
  .title.nl
  .pushWrap(4)
  .tab.text('A tool for sending a pushover notification').nl
  .popWrap()
  .nl
  .flags.nl
  .pushWrap(8)
  .dict
  .key.tab.flag('--user', '-U').value.text('The user key').end.nl
  .key.tab.flag('--token', '-T').value.text('The API token').end.nl
  .key.tab.flag('--message', '-m').value.text('The message to send').end.nl
  .key.tab.flag('--title', '-t').value.text('The title to use for the message (optional)').end.nl
  .key.tab.flag('--help', '-h').value.text('Print this help').end.nl
  .endDict
  .popWrap()
  .nl
  .bold('NOTES:').nl
  .pushWrap(4)
  .tab.text('The user key, API token, and message parameters are required').nl
  .popWrap()
  .nl
  .toString(120);

let options = null;
try {
  options = argParser()
    .string('user', '--user', '-U')
    .string('token', '--token', '-T')
    .string('message', '--message', '-m')
    .string('title', '--title', '-t')
    .help(helpText, '--help', '-h')
    .argv;
} catch (e) {
  console.error(red.bright(`${bold('Error in arguments:')} ${e.message}`));
  process.exit(1);
}

async function notify(message, title, user, token) {
  return new Promise((resolve, reject) => {
    new Push({ user, token }).send({
      message,
      title
    }, (err, result) => {
      if(err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

async function run(options) {
  const user = options.user;
  const token = options.token;
  const message = options.message;
  let title = options.title;
  const errors = [];
  if(!user || user.length == 0) {
    errors.push('You must provide a User Key (--user, -U)');
  }
  if(!token || token.length == 0) {
    errors.push('You must provide an API token (--token, -T)');
  }
  if(!message || message.length == 0) {
    errors.push('You must provide a message (--message, -m)');
  }
  if(errors.length > 0) {
    errors.forEach((e) => console.error(style(bold, red.bright)(e)));
    process.exit(1);
  }
  if(!title || title.length == 0) {
    title = undefined;
  }
  try {
    const result = await notify(message, title, user, token);
    console.log(result);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run(options);
