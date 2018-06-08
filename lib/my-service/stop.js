const { lcStop } = require('./common/util');

exports.command = ['stop <service>', 'shutdown', 'sd'];
exports.describe = 'Stop the given service; does NOT disable the service';

exports.builder = {
    service: {
        describe: 'The service to act on; the prefix is automatically added.',
        type: 'string'
    }
};

exports.handler = async argv => {
    console.log(await lcStop(argv.prefix, argv.service));
};