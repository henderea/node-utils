const { lcEnable } = require('./common/util');

exports.command = ['enable <service>', 'on', 'e'];
exports.describe = 'Enable the given service';

exports.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

exports.handler = (argv) => {
  console.log(lcEnable(argv.prefix, argv.service));
};
