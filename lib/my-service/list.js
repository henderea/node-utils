const { lcList } = require('./common/util');

exports.command = ['list', 'ls', 'l'];
exports.describe = 'List the services';

exports.builder = {};

exports.handler = (argv) => {
  lcList(argv.prefix).forEach((i) => console.log(i));
};
