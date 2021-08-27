#!/usr/bin/env node

import simpleGit from 'simple-git/promise.js';
import inquirer from 'inquirer';
import { orderBy } from 'natural-orderby';
import chalk from 'chalk';
import figures from 'figures';

import _pad from 'lodash/pad.js';

class Separator extends inquirer.Separator {
  constructor(line) {
    super(line);
    this.line = line || new Array(15).join(figures.line);
  }
}

let fileSorter = (list) => orderBy(list, [(v) => v.path.replace(/[_-]/g, ' '), (v) => v.path]);
let determineChecked = (f) => f.working_dir == ' ' ? true : (['?', ' '].includes(f.index) ? false : null);

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
    fileSorter(otherFiles).map((f) => ({ name: f.path, checked: determineChecked(f) })).forEach((c) => choices.push(c));
    choices.push(new Separator(chalk.bold.blue(sepLine)));
  }
  if(deletedFiles.length > 0) {
    choices.push(new Separator('\n' + chalk.bold.red(sepText('Deleted Files'))));
    fileSorter(deletedFiles).map((f) => ({ name: f.path, checked: determineChecked(f) })).forEach((c) => choices.push(c));
    choices.push(new Separator(chalk.bold.red(sepLine)));
  }
  if(newFiles.length > 0) {
    choices.push(new Separator('\n' + chalk.bold.green(sepText('New Files'))));
    fileSorter(newFiles).map((f) => ({ name: f.path, checked: determineChecked(f) })).forEach((c) => choices.push(c));
    choices.push(new Separator(chalk.bold.green(sepLine)));
  }
  return choices;
};

import gitAddInteractiveCheckboxPrompt from '../lib/git-add-interactive-checkbox-prompt.mjs';

inquirer.registerPrompt('git-add-checkbox', gitAddInteractiveCheckboxPrompt);

const getPageSize = async (git, defaultValue = 20) => {
  const rawPageSize = (await git.raw(['config', 'add-interactive.pageSize']) || '').trim();
  return /^\d+$/.test(rawPageSize) ? parseInt(rawPageSize) : defaultValue;
};

async function run() {
  const git = simpleGit();

  const choices = await createChoices(git);

  const pageSize = await getPageSize(git);

  await inquirer.prompt({ type: 'git-add-checkbox', name: 'Staging', message: '', choices, git, createChoices, pageSize });
}

run();
