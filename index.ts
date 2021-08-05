
import http from 'http';
import type express from 'express'
import { connector, summarise } from 'swagger-routes-express';
import * as overrideHandler from './routers/override-handler';

import { walk } from './utils/index';
import chalk from 'chalk';
import _ from 'lodash';
import generateRouterHandler from './routers/generateRouterHandler';
import { customizeMergeSwaggerConfig } from './helpers';
import getSwaggerConfig from './helpers/getSwaggerConfig';
import config from './mock.config';
import { app } from './app'


const log = (...params) => {
  const parseParams = JSON.parse(JSON.stringify(params));
  console.log(...parseParams);
};

const { port, localPath, selectedTag } = config;

// Event listener for HTTP server "error" event.
function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error('Express ERROR (app) : %s requires elevated privileges', bind);
      process.exit(1);
    // eslint-disable-next-line no-fallthrough
    case 'EADDRINUSE':
      console.error('Express ERROR (app) : %s is already in use', bind);
      process.exit(1);
    // eslint-disable-next-line no-fallthrough
    default:
      throw error;
  }
}

const mergeDefinition = async (localPath) => {
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

  const apiDefinitionJson = (await getSwaggerConfig()) || {};
  const mergeDefinitionJson = _.mergeWith(fileDefinitionJson || {}, apiDefinitionJson, customizeMergeSwaggerConfig);
  return mergeDefinitionJson;
};

const createServer = async (app: express.Application) => {
  const mergeDefinitionJson = await mergeDefinition(localPath);
  // Create mock functions based on swaggerConfig
  const mockRoutersHandler = generateRouterHandler(mergeDefinitionJson, selectedTag);
  const mergeRouterHandler = Object.assign({}, mockRoutersHandler, overrideHandler);
  const connectSwagger = connector(mergeRouterHandler, mergeDefinitionJson);
  connectSwagger(app);
  // Print swagger router api summary
  // const apiSummary = summarise(mergeDefinitionJson);

  // Create HTTP server.
  const server = http.createServer(app);

  // Listen on provided port, on all network interfaces.
  server.listen(port);
  server.on('error', onError);
};

createServer(app);
