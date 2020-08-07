import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { connector, summarise } from 'swagger-routes-express';
import * as routers from './routers';
import generatedHandler from './routers/generatedHandler';
import getSwaggerConfig from './helpers/getSwaggerConfig';

const app = express();
const port = 9009;
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

const createServer = async (app: express.Application) => {
  const apiDefinitionJson = await getSwaggerConfig();
  apiDefinitionJson.basePath = '/mock-api';
  // Create mock functions based on swaggerConfig
  generatedHandler(routers, apiDefinitionJson);
  const connectSwagger = connector(routers, apiDefinitionJson);
  connectSwagger(app);
  // Print swagger router api summary
  const apiSummary = summarise(apiDefinitionJson);
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
  console.log('Mock server started on port ' + port + '!');
};

createServer(app);
