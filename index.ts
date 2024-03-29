import http from 'http';
import type express from 'express';
import { log } from '@vue/cli-shared-utils';
import { connector, summarise } from 'swagger-routes-express';
import chalk from 'chalk';
import _ from 'lodash';

import * as overrideHandler from './routers/override-handler';
import { walk, getSwaggerConfig, getUserConfig, customizeMergeSwaggerConfig } from './utils/index';
import generateRouterHandler from './routers/generateRouterHandler';
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
  swaggerConfig: any;

  constructor(option: Option, app: express.Application) {
    const userConfig = getUserConfig();
    this.config = Object.assign(config, userConfig, option);
    this.app = app;
  }

  async create() {
    await this.mergeDefinition();
    const { port, tag } = this.config;
    // Create mock functions based on swaggerConfig
    const mockRoutersHandler = generateRouterHandler(this.swaggerConfig, tag);
    const mergeRouterHandler = Object.assign({}, mockRoutersHandler, overrideHandler);
    const connectSwagger = connector(mergeRouterHandler, this.swaggerConfig);

    connectSwagger(this.app);
    // Print swagger router api summary
    // const apiSummary = summarise(mergeDefinitionJson);
    // console.log('🚀 ~ file: index.ts ~ line 73 ~ createServer ~ apiSummary', apiSummary);

    // Create HTTP server.
    const server = http.createServer(this.app);

    // Listen on provided port, on all network interfaces.
    server.listen(port);
    server.on('error', this.onError.bind(this));
    return this;
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
    // 重置原来swagger配置host，schemas
    mergeDefinitionJson.host = '';
    mergeDefinitionJson.schemes = ['https'];
    this.swaggerConfig = mergeDefinitionJson;
    return this;
  }

  redirectHost() {
    const { redirectPath } = this.config;
    this.app.get('/', (req, res) => {
      res.redirect(301, 'http://' + req.headers.host + `/${redirectPath}`);
    });
    return this;
  }

  useSwaggerConfig() {
    const { isHttps } = this.config;
    this.app.get('/swagger-config.json', (req, res) => {
      const schemes = (req.connection as any)?.encrypted || isHttps ? ['https', 'http'] : ['http'];
      res.json(Object.assign({}, this.swaggerConfig, { schemes }));
    });
    return this;
  }

  log() {
    const { port, copy } = this.config;
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
        break;
      case 'EADDRINUSE':
        console.error('Express ERROR (app) : Port %s is already in use', port);
        break;
      default:
        throw error;
    }
    process.exit(1);
  }
}

const start = async (option?: Option) => {
  const server = new Server(option, app);
  (await server.create()).useSwaggerConfig().redirectHost().log();
  // Catch 404 error
  app.use((req: any, res: any) => {
    const err = new Error('Not Found');
    res.status(404).json({
      message: err.message,
      error: err,
    });
  });
};

if (process.env.TS_NODE_DEV) {
  start();
}

export default start;
