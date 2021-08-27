import path from 'path';

import { spawn } from './common/util.mjs';

const command = {};
command.command = 'elog <service>';
command.describe = 'Start a less with the stderr log file';

command.builder = {
  service: {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }
};

command.handler = async (argv) => spawn('less', [path.resolve('/tmp', `${argv.prefix}${argv.service}.stderr`)], { stdio: 'inherit', stripFinalNewline: false });

export default command;
