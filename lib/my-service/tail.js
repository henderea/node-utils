const { spawn } = require('./common/util');
const path = require('path');

exports.command = 'tail <service>';
exports.describe = 'Start a tail -f with the stdout log file';

exports.builder = {
    service: {
        describe: 'The service to act on; the prefix is automatically added.',
        type: 'string'
    }
};

exports.handler = async argv => spawn('tail', ['-f', path.resolve('/tmp', `${argv.prefix}${argv.service}.stdout`)], { stdio: 'inherit' });