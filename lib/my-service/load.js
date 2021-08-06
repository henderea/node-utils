const { lcLoad } = require('./common/util');

exports.command = ['load <service>'];
exports.describe = 'Load the given service';

exports.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

exports.handler = (argv) => {
  console.log(lcLoad(argv.prefix, argv.service));
};
