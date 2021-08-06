const { lcUnload } = require('./common/util');

exports.command = ['unload <service>'];
exports.describe = 'Unload the given service';

exports.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

exports.handler = (argv) => {
  console.log(lcUnload(argv.prefix, argv.service));
};
