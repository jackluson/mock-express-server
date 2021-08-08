#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const chalk = require('chalk');
const pkgDir = require('pkg-dir');

const { name, bin, main, version } = require('../package.json');
const projectRoot = pkgDir.sync(process.cwd());
const distDir = 'dist';
const defaultConfigFileName = 'default.config.js';
const defaultConfigPath = path.join(projectRoot, distDir, defaultConfigFileName);

const defaultConfig = require(defaultConfigPath);
const { port } = defaultConfig.default || defaultConfig;

program
  .command('start')
  .description('start a swagger config mock server')
  .option('-p, --port <port>', `Port used for the mock server (the default isn ${port})`)
  .action(async (option, ...args) => {
    const startEntryPath = projectRoot + '/' + main;
    const start = require(startEntryPath).default;
    start(option);
  });

// add some useful info on help
program.on('--help', () => {
  console.log();
  console.log(`  Run ${chalk.cyan(`mock-server <command> --help`)} for detailed usage of given command.`);
  console.log();
});
// program
//   .command('deploy')
//   .description('deploy web site to production')
//   .action(() => {
//     console.log('deploy');
//   });

// program
//   .command('clone <source> [destination]')
//   .description('clone a repository into a newly created directory')
//   .action((source, destination) => {
//     console.log('🚀 -------------------------------------------------------------------------------------');
//     console.log('🚀 ~ file: mock-server.js ~ line 27 ~ .action ~ source, destination', source, destination);
//     console.log('🚀 -------------------------------------------------------------------------------------');
//     console.log('clone command called');
//   });
// program
//   .command('start <source> [destination]')
//   .description('start a repository into a newly created directory')
//   .action((source, destination) => {
//     console.log('🚀 -------------------------------------------------------------------------------------');
//     console.log('🚀 ~ file: mock-server.js ~ line 27 ~ .action ~ source, destination', source, destination);
//     console.log('🚀 -------------------------------------------------------------------------------------');
//     console.log('start command called');
//   });

// // 通过独立的的可执行文件实现命令 (注意这里指令描述是作为`.command`的第二个参数)
// // 返回最顶层的命令以供继续添加子命令
// // program
// //   .version('0.1.0')
// //   .argument('<username>', 'user to login')
// //   .argument('[password]', 'password for user, if required', 'no password given')
// //   .description('example program for argument')
// //   .action((username, password) => {
// //     console.log('username:', username);
// //     console.log('password:', password);
// //   });
// program
//   .command('ls')
//   .argument('<dirs...>')
//   .action(function (dirs) {
//     dirs.forEach((dir) => {
//       console.log('ls %s', dir);
//     });
//   });

// program
//   .description('An application for pizza ordering')
//   .option('-p, --peppers', 'Add peppers')
//   .option('-c, --cheese <type>', 'Add the specified type of cheese', 'marble')
//   .option('-C, --no-cheese', 'You do not want any cheese');
// program.parse(process.argv);

program.addHelpText(
  'after',
  `
More detail:
https://github.com/jackluson/mock-express-server
`,
);

// program.helpOption('-e, --HELP', 'read more information');

program.name(name).version(version).usage('[command] [flags]').parse(process.argv);
