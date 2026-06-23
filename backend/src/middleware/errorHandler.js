import { AppError, errorResponse } from '../utils/response.js';

export function notFound(req, res) {
  return errorResponse(res, { message: `Route ${req.method} ${req.path} not found`, statusCode: 404 });
}

export function errorHandler(err, req, res, _next) {
  console.error(err);

  if (err.isOperational || err instanceof AppError) {
    return errorResponse(res, { message: err.message, statusCode: err.statusCode || 400 });
  }

  if (err.name === 'ValidationError') {
    return errorResponse(res, { message: err.message, statusCode: 400 });
  }

  if (err.code === 11000) {
    return errorResponse(res, { message: 'Duplicate entry', statusCode: 409 });
  }

  return errorResponse(res, {
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    statusCode: 500,
  });
}
