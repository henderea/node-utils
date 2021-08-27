import { lcUnload } from './common/util.mjs';

const command = {};
command.command = ['unload <service>'];
command.describe = 'Unload the given service';

command.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

command.handler = (argv) => {
  console.log(lcUnload(argv.prefix, argv.service));
};

export default command;
