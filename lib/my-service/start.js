const { lcStart } = require('./common/util');

exports.command = ['start <service>', 'startup', 'su'];
exports.describe = 'Start the given service; enables the service';

exports.builder = {
    service: {
        describe: 'The service to act on; the prefix is automatically added.',
        type: 'string'
    }
};

exports.handler = argv => {
    console.log(lcStart(argv.prefix, argv.service));
};