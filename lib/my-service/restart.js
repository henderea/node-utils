const { lcStart, lcStop } = require('./common/util');

exports.command = ['restart <service>', 'rst'];
exports.describe = 'Restart the given service';

exports.builder = {
    service: {
        describe: 'The service to act on; the prefix is automatically added.',
        type: 'string'
    }
};

exports.handler = async argv => {
    console.log(await lcStop(argv.prefix, argv.service));
    console.log(lcStart(argv.prefix, argv.service));
};