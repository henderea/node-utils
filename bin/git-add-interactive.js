#!/usr/bin/env node

const simpleGit = require('simple-git/promise');
const inquirer = require('inquirer');
const { orderBy } = require('natural-orderby');

let fileSorter = list => orderBy(list, [v => v.path.replace(/[_-]/g, ' '), v => v.path]);
let determineChecked = f => f.working_dir == ' ' ? true : (['?', ' '].includes(f.index) ? false : null);

const createChoices = async git => {
    const status = await git.status();

    const choices = [];
    const newFiles = status.files.filter(f => ['?', 'A', 'N'].includes(f.index) && f.working_dir != 'D');
    const deletedFiles = status.files.filter(f => f.index == 'D' || f.working_dir == 'D')
    const otherFiles = status.files.filter(f => !['?', 'A', 'N', 'D'].includes(f.index) && f.working_dir != 'D');

    if(otherFiles.length > 0) {
        choices.push(new inquirer.Separator(' = Modified Files = '));
        fileSorter(otherFiles).map(f => ({ name: f.path, checked: determineChecked(f) })).forEach(c => choices.push(c));
    }
    if(deletedFiles.length > 0) {
        choices.push(new inquirer.Separator(' = Deleted Files = '));
        fileSorter(deletedFiles).map(f => ({ name: f.path, checked: determineChecked(f) })).forEach(c => choices.push(c));
    }
    if(newFiles.length > 0) {
        choices.push(new inquirer.Separator(' = New Files = '));
        fileSorter(newFiles).map(f => ({ name: f.path, checked: determineChecked(f) })).forEach(c => choices.push(c));
    }
    return choices;
}

inquirer.registerPrompt('git-add-checkbox', require('../lib/git-add-interactive-checkbox-prompt'));

const getPageSize = async (git, defaultValue = 20) => {
    const rawPageSize = (await git.raw(['config', 'add-interactive.pageSize']) || '').trim();
    return /^\d+$/.test(rawPageSize) ? parseInt(rawPageSize) : defaultValue;
}

async function run() {
    const git = simpleGit();

    const choices = await createChoices(git);

    const pageSize = await getPageSize(git);

    await inquirer.prompt({ type: 'git-add-checkbox', name: 'Staging', message: '', choices, git, createChoices, pageSize });
}

run();