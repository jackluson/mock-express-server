#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const pkgDir = require('pkg-dir');

const { name, bin, main, version } = require('../package.json');
const distDir = 'dist';
const defaultConfigFileName = 'default.config.js';
const userConfigPath = 'mock.config.js';

const projectRoot = pkgDir.sync(__dirname);
const defaultConfigPath = path.join(projectRoot, distDir, defaultConfigFileName);

const workRoot = process.cwd();
let userConfig = {};

const isExistUseConfig = fs.existsSync(`${workRoot}/${userConfigPath}`);
if (isExistUseConfig) {
  userConfig = require(`${workRoot}/${userConfigPath}`);
}

const defaultConfig = require(defaultConfigPath);
const { port, url, openValidParams, copy, localPath, tag } = defaultConfig.default || defaultConfig;

// const isAbsolute = path.isAbsolute(localPath);
// console.log('🚀 -----------------------------------------------------------');
// console.log('🚀 ~ file: mock-server.js ~ line 23 ~ isAbsolute', isAbsolute);
// console.log('🚀 -----------------------------------------------------------');

program
  .command('start')
  .description('start a swagger config mock server')
  .option('-p, --port <port>', `Port used for the mock server (the default is ${port})`)
  .option('-u, --url <url>', `Swagger config url address (the default is ${url || "''"})`)
  .option('-l, --localPath <localPath>', `Local swagger configuration file path(the default is ${localPath || "''"})`)
  .option('-t, --tag <tag>', `Swagger config tag to be selected(the default is ${tag || "''"})`)
  .option(
    '-v, --openValidParams',
    `Whether to verify that the request parameter type is validable(the default is ${openValidParams})`,
  )
  .option('-c, --copy', `Whether to automatically paste to the clipboard (the default is ${copy})`)
  .action(async (option, ...args) => {
    console.log('🚀 -------------------------------------------------------------');
    console.log('🚀 ~ file: mock-server.js ~ line 42 ~ .action ~ option', option);
    console.log('🚀 -------------------------------------------------------------');
    const mergeOption = Object.assign(userConfig, option);
    const startEntryPath = projectRoot + '/' + main;
    const start = require(startEntryPath).default;
    start(mergeOption);
  });

// add some useful info on help
program.on('--help', () => {
  console.log();
  console.log(`  Run ${chalk.cyan(`mock-server <command> --help`)} for detailed usage of given command.`);
  console.log();
});

program.addHelpText(
  'after',
  `
More detail:
https://github.com/jackluson/mock-express-server
`,
);

// program.helpOption('-e, --HELP', 'read more information');

program.name(name).version(version).usage('[command] [flags]').parse(process.argv);
