import { lcStatus, statusCheck } from './common/util.mjs';

const command = {};
command.command = ['status <service>', 'stat', 's'];
command.describe = 'Check if the given service is running';

command.builder = (yargs) => {
  return yargs.positional('service', {
    describe: 'The service to act on; the prefix is automatically added.',
    type: 'string'
  }).option('quiet', {
    alias: ['q'],
    describe: 'Indicate the status with the exit code. Uses exit code 0 for running, 1 for loaded, 2 for unloaded, and 3 for not found',
    type: 'boolean'
  });
};

function statusCodeToExitCode(status) {
  if(status > 0) { return 0; }
  if(status == 0) { return 1; }
  if(status == -1) { return 2; }
  if(status == -2) { return 3; }
  return -1;
}

command.handler = (argv) => {
  if(argv.quiet === true) {
    const status = statusCheck(argv.prefix, argv.service);
    process.exit(statusCodeToExitCode(status));
  } else {
    console.log(lcStatus(argv.prefix, argv.service));
  }
};

export default command;
