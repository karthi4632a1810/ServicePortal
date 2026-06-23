import { ZodError } from 'zod';
import { AppError } from '../utils/response.js';

export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
      }
      next(err);
    }
  };
}
