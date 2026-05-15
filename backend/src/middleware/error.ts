// ======================
// JWT Authentication Middleware
// ======================

import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(400).json({ error: 'Validation', issues: err.issues });
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
};
