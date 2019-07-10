const _each = require('lodash/each');

const { lcList } = require('./common/util');

exports.command = ['list', 'ls', 'l'];
exports.describe = 'List the services';

exports.builder = {};

exports.handler = argv => {
    _each(lcList(argv.prefix), i => console.log(i));
}