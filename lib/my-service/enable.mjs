import { lcEnable } from './common/util.mjs';

const command = {};
command.command = ['enable <service>', 'on', 'e'];
command.describe = 'Enable the given service';

command.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

command.handler = (argv) => {
  console.log(lcEnable(argv.prefix, argv.service));
};

export default command;
