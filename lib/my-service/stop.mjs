import { lcStop } from './common/util.mjs';

const command = {};
command.command = ['stop <service>', 'shutdown', 'sd'];
command.describe = 'Stop the given service; does NOT disable the service';

command.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

command.handler = async (argv) => {
  console.log(await lcStop(argv.prefix, argv.service));
};

export default command;
