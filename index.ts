import http from 'http';
import type express from 'express';
const { log } = require('@vue/cli-shared-utils');
import { connector, summarise } from 'swagger-routes-express';
import * as overrideHandler from './routers/override-handler';

import { walk } from './utils/index';
import chalk from 'chalk';
import _ from 'lodash';
import generateRouterHandler from './routers/generateRouterHandler';
import { customizeMergeSwaggerConfig } from './helpers';
import getSwaggerConfig from './helpers/getSwaggerConfig';
import config from './default.config';
import { app } from './app';

// const log = (...params) => {
//   const parseParams = JSON.parse(JSON.stringify(params));
//   console.log(...parseParams);
// };

type Option = Pick<typeof config, 'port' | 'copy'>;
class Server {
  config: typeof config;
  app: express.Application;

  constructor(option: Option, app: express.Application) {
    this.config = Object.assign(config, option);
    this.app = app;
  }

  async create() {
    const { port, copy, selectedTag } = this.config;
    const mergeDefinitionJson = await this.mergeDefinition();
    // Create mock functions based on swaggerConfig
    const mockRoutersHandler = generateRouterHandler(mergeDefinitionJson, selectedTag);
    const mergeRouterHandler = Object.assign({}, mockRoutersHandler, overrideHandler);
    const connectSwagger = connector(mergeRouterHandler, mergeDefinitionJson);

    connectSwagger(this.app);
    // Print swagger router api summary
    // const apiSummary = summarise(mergeDefinitionJson);
    // console.log('🚀 ~ file: index.ts ~ line 73 ~ createServer ~ apiSummary', apiSummary);

    // Create HTTP server.
    const server = http.createServer(this.app);

    // Listen on provided port, on all network interfaces.
    server.listen(port);
    server.on('error', this.onError.bind(this));

    let copied = '';
    const localUrlForBrowser = `http://localhost:${port}/`;
    if (copy) {
      require('clipboardy').writeSync(localUrlForBrowser);
      copied = chalk.dim('(copied to clipboard)');
    }

    console.log();
    console.log(`  mock server running at:`);
    console.log(`  - Local:   ${chalk.cyan(localUrlForBrowser)} ${copied}`);
  }

  async mergeDefinition() {
    const { url, localPath } = this.config;
    let fileDefinitionJson;
    if (localPath) {
      try {
        const filePaths = await walk(localPath);
        for (const filePath of filePaths) {
          const absolutePath = filePath;
          const { default: curConfig } = await import(absolutePath);
          fileDefinitionJson = _.mergeWith(fileDefinitionJson || {}, curConfig, customizeMergeSwaggerConfig);
        }
      } catch (error) {
        log(chalk.red(error));
      }
    }

    const apiDefinitionJson = (await getSwaggerConfig(url)) || {};
    const mergeDefinitionJson = _.mergeWith(fileDefinitionJson || {}, apiDefinitionJson, customizeMergeSwaggerConfig);
    return mergeDefinitionJson;
  }

  // Event listener for HTTP server "error" event.
  onError(error: any) {
    const { port } = this.config;
    if (error.syscall !== 'listen') {
      throw error;
    }
    // const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error('Express ERROR (app) : Port %s requires elevated privileges', port);
        process.exit(1);
      // eslint-disable-next-line no-fallthrough
      case 'EADDRINUSE':
        console.error('Express ERROR (app) : Port %s is already in use', port);
        process.exit(1);
      // eslint-disable-next-line no-fallthrough
      default:
        throw error;
    }
  }
}

const start = async (option) => {
  const server = new Server(option, app);
  await server.create();
  // await createServer(app, option);
  // Catch 404 error
  app.use((req: any, res: any) => {
    const err = new Error('Not Found');
    res.status(404).json({
      message: err.message,
      error: err,
    });
  });
};

export default start;
