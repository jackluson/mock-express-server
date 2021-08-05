import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import routers from './routers';

const app = express();

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
// Catch 404 error
app.use((req: any, res: any) => {
  const err = new Error('Not Found');
  res.status(404).json({
    message: err.message,
    error: err,
  });
});
app.use(routers);



export { app};
