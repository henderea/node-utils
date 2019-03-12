#!/usr/bin/env node

const inquirer = require('inquirer');
const yargs = require('yargs');

const options = yargs
    .string('message')
    .nargs('message', 1)
    .argv;

const prompt = inquirer.createPromptModule({ output: process.stderr });

prompt({
    type: 'input',
    name: 'value',
    message: options.message
}).then(answers => {
    process.stdout.write(answers.value);
});
