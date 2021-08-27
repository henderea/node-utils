import { lcStart } from './common/util.mjs';

const command = {};
command.command = ['start <service>', 'startup', 'su'];
command.describe = 'Start the given service; enables the service';

command.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

command.handler = (argv) => {
  console.log(lcStart(argv.prefix, argv.service));
};

export default command;
