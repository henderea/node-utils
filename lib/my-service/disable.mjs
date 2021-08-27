import { lcDisable } from './common/util.mjs';

const command = {};
command.command = ['disable <service>', 'off', 'd'];
command.describe = 'Disable the given service';

command.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

command.handler = (argv) => {
  console.log(lcDisable(argv.prefix, argv.service));
};

export default command;
