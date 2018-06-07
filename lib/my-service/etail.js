const { spawnSync } = require('child_process');
const path = require('path');

exports.command = 'etail <service>';
exports.describe = 'Start a tail -f with the stderr log file';

exports.builder = {
    service: {
        describe: 'The service to act on; the com.henderea. prefix is automatically added.',
        type: 'string'
    }
};

exports.handler = argv => {
    spawnSync('tail', ['-f', path.resolve('/tmp', `com.henderea.${argv.service}.stderr`)], { stdio: 'inherit' });
};