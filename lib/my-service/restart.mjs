import { lcStart, lcStop } from './common/util.mjs';

const command = {};
command.command = ['restart <service>', 'rst'];
command.describe = 'Restart the given service';

command.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

command.handler = async (argv) => {
  console.log(await lcStop(argv.prefix, argv.service));
  console.log(lcStart(argv.prefix, argv.service));
};

export default command;
