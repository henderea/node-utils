import { lcList } from './common/util.mjs';

const command = {};
command.command = ['list', 'ls', 'l'];
command.describe = 'List the services';

command.builder = {};

command.handler = (argv) => {
  lcList(argv.prefix).forEach((i) => console.log(i));
};

export default command;
