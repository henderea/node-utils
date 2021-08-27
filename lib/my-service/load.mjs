import { lcLoad } from './common/util.mjs';

const command = {};
command.command = ['load <service>'];
command.describe = 'Load the given service';

command.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

command.handler = (argv) => {
  console.log(lcLoad(argv.prefix, argv.service));
};

export default command;
