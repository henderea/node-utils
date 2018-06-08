const { lcStatus } = require('./common/util');

exports.command = ['status <service>', 'stat', 's'];
exports.describe = 'Check if the given service is running';

exports.builder = {
    service: {
        describe: 'The service to act on; the prefix is automatically added.',
        type: 'string'
    }
};

exports.handler = argv => {
    console.log(lcStatus(argv.prefix, argv.service));
};