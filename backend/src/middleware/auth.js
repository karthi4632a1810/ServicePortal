import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import { errorResponse } from '../utils/response.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return errorResponse(res, { message: 'Authentication required', statusCode: 401 });
    }

    const token = header.slice(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.active) {
      return errorResponse(res, { message: 'Invalid or inactive user', statusCode: 401 });
    }

    req.user = user;
    next();
  } catch {
    return errorResponse(res, { message: 'Invalid or expired token', statusCode: 401 });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
}

import { authorizeRole } from '../utils/roles.js';

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, { message: 'Authentication required', statusCode: 401 });
    }
    if (roles.length && !authorizeRole(req.user.role, roles)) {
      return errorResponse(res, { message: 'Insufficient permissions', statusCode: 403 });
    }
    next();
  };
}

export function signToken(userId) {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}
