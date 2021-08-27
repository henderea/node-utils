import path from 'path';

import { spawn } from './common/util.mjs';

const command = {};
command.command = 'etail <service>';
command.describe = 'Start a tail -f with the stderr log file';

command.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

command.handler = async (argv) => spawn('tail', ['-f', path.resolve('/tmp', `${argv.prefix}${argv.service}.stderr`)], { stdio: 'inherit', stripFinalNewline: false });

export default command;
