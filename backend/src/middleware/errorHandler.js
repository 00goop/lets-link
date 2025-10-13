import { NODE_ENV } from '../config.js';

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Unexpected error occurred';
  const response = { message };
  if (NODE_ENV !== 'production') {
    response.stack = err.stack;
  }
  res.status(status).json(response);
};
