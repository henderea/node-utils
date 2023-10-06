#!/usr/bin/env node

import simpleGit from 'simple-git';
import inquirer from 'inquirer';
import { orderBy } from 'natural-orderby';
import chalk from 'chalk';
import figures from 'figures';
// import ttys from 'ttys';

import _pad from 'lodash/pad.js';

chalk.level = 3;

class Separator extends inquirer.Separator {
  constructor(line) {
    super(line);
    this.line = line || new Array(15).join(figures.line);
  }
}

let fileSorter = (list) => orderBy(list, [(v) => v.path.replace(/[_-]/g, ' '), (v) => v.path]);

const sepText = (label) => _pad(` ${label} `, 40, '=');

const sepLine = '='.repeat(40);

const createChoices = async (git) => {
  const status = await git.status();

  const choices = [];
  const newFiles = status.files.filter((f) => ['?', 'A', 'N'].includes(f.index) && f.working_dir != 'D');
  const deletedFiles = status.files.filter((f) => f.index == 'D' || f.working_dir == 'D');
  const otherFiles = status.files.filter((f) => !['?', 'A', 'N', 'D'].includes(f.index) && f.working_dir != 'D');

  if(otherFiles.length > 0) {
    choices.push(new Separator('\n' + chalk.bold.blue(sepText('Modified Files'))));
    fileSorter(otherFiles).map((f) => ({ name: f.path })).forEach((c) => choices.push(c));
    choices.push(new Separator(chalk.bold.blue(sepLine)));
  }
  if(deletedFiles.length > 0) {
    choices.push(new Separator('\n' + chalk.bold.red(sepText('Deleted Files'))));
    fileSorter(deletedFiles).map((f) => ({ name: f.path })).forEach((c) => choices.push(c));
    choices.push(new Separator(chalk.bold.red(sepLine)));
  }
  if(newFiles.length > 0) {
    choices.push(new Separator('\n' + chalk.bold.green(sepText('New Files'))));
    fileSorter(newFiles).map((f) => ({ name: f.path })).forEach((c) => choices.push(c));
    choices.push(new Separator(chalk.bold.green(sepLine)));
  }
  return choices;
};

const getPageSize = async (git, defaultValue = 20) => {
  const rawPageSize = (await git.raw(['config', 'add-interactive.pageSize']) || '').trim();
  return /^\d+$/.test(rawPageSize) ? parseInt(rawPageSize) : defaultValue;
};

async function run() {
  const git = simpleGit();

  const choices = await createChoices(git);

  const pageSize = await getPageSize(git);
  const p = inquirer.createPromptModule({ input: process.stdin, output: process.stderr });

  const { files } = await p({ type: 'checkbox', name: 'files', message: 'Select Files', choices, pageSize });
  if(!files || files.length <= 0) { process.exit(1); }
  process.stdout.write(files.join('\0'));
  process.exit(0);
}

run();
