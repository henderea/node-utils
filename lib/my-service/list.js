const each = require('lodash/each');

const { plistDir, lcList } = require('./common/util');

exports.command = ['list', 'ls', 'l'];
exports.describe = 'List the services';

exports.builder = {};

exports.handler = argv => {
    each(lcList(), i => console.log(i));
}