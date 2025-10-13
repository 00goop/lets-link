import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { CORS_ORIGIN } from './config.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

const corsOrigins = CORS_ORIGIN.trim() === '*'
  ? true
  : CORS_ORIGIN.split(',').map((v) => v.trim());

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/', routes);

app.use(errorHandler);

export default app;
