const { spawnSync } = require('child_process');
const path = require('path');

exports.command = 'elog <service>';
exports.describe = 'Start a less with the stderr log file';

exports.builder = {
    service: {
        describe: 'The service to act on; the prefix is automatically added.',
        type: 'string'
    }
};

exports.handler = argv => {
    spawnSync('less', [path.resolve('/tmp', `${argv.prefix}${argv.service}.stderr`)], { stdio: 'inherit' });
};