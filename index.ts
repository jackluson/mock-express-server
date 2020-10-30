import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { connector, summarise } from 'swagger-routes-express';
import * as overrideHandler from './routers/override-handler';
import routers from './routers';
import { walk } from './utils/index';
import chalk from 'chalk';
import _ from 'lodash';
import generateRouterHandler from './routers/generateRouterHandler';
import { customizeMergeSwaggerConfig } from './helpers';
import getSwaggerConfig from './helpers/getSwaggerConfig';
import config from './mock.config';

const app = express();
const log = (...params) => {
  const parseParams = JSON.parse(JSON.stringify(params));
  console.log(...parseParams);
};

const { port, localPath, selectedTag } = config;
// Logger
app.use(morgan('dev'));
// Enable CORS
app.use(cors());
// POST, PUT, DELETE body parser
app.use(bodyParser.json({ limit: '20mb' }));
app.use(
  bodyParser.urlencoded({
    limit: '20mb',
    extended: false,
  }),
);

// No cache
app.use((req: any, res: { header: (arg0: string, arg1: string) => void }, next: () => void) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '-1');
  next();
});

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
  console.log(`: ------------------------------------------------------`);
  console.log(`createServer -> mockRoutersHandler`, mockRoutersHandler);
  console.log(`: ------------------------------------------------------`);
  const mergeRouterHandler = Object.assign({}, mockRoutersHandler, overrideHandler);
  const connectSwagger = connector(mergeRouterHandler, mergeDefinitionJson);
  connectSwagger(app);
  // Print swagger router api summary
  // const apiSummary = summarise(mergeDefinitionJson);
  // Catch 404 error
  app.use((req: any, res: any) => {
    const err = new Error('Not Found');
    res.status(404).json({
      message: err.message,
      error: err,
    });
  });

  // Create HTTP server.
  const server = http.createServer(app);

  // Listen on provided port, on all network interfaces.
  server.listen(port);
  server.on('error', onError);
};

createServer(app);
app.use(routers);
