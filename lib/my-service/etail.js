const path = require('path');

const { spawn } = require('./common/util');

exports.command = 'etail <service>';
exports.describe = 'Start a tail -f with the stderr log file';

exports.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

exports.handler = async (argv) => spawn('tail', ['-f', path.resolve('/tmp', `${argv.prefix}${argv.service}.stderr`)], { stdio: 'inherit' });
