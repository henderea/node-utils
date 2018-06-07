const { spawnSync } = require('child_process');
const path = require('path');

exports.command = 'log <service>';
exports.describe = 'Start a less with the stdout log file';

exports.builder = {
    service: {
        describe: 'The service to act on; the com.henderea. prefix is automatically added.',
        type: 'string'
    }
};

exports.handler = argv => {
    spawnSync('less', [path.resolve('/tmp', `com.henderea.${argv.service}.stdout`)], { stdio: 'inherit' });
};