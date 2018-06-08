const { spawnSync } = require('child_process');
const path = require('path');

exports.command = 'etail <service>';
exports.describe = 'Start a tail -f with the stderr log file';

exports.builder = {
    service: {
        describe: 'The service to act on; the prefix is automatically added.',
        type: 'string'
    }
};

exports.handler = argv => {
    spawnSync('tail', ['-f', path.resolve('/tmp', `${argv.prefix}${argv.service}.stderr`)], { stdio: 'inherit' });
};