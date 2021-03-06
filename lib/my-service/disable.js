const { lcDisable } = require('./common/util');

exports.command = ['disable <service>', 'off', 'd'];
exports.describe = 'Disable the given service';

exports.builder = {
    service: {
        describe: 'The service to act on; the prefix is automatically added.',
        type: 'string'
    }
};

exports.handler = argv => {
    console.log(lcDisable(argv.prefix, argv.service));
};