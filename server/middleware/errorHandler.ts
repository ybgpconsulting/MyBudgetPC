import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(`[ERROR] ${err.message}`, err.stack);
  if (err.message?.includes('duplicate key')) {
    return res.status(409).json({ error: 'Resource already exists.' });
  }
  if (err.message?.includes('foreign key')) {
    return res.status(400).json({ error: 'Referenced resource not found.' });
  }
  if (err.message?.includes('check constraint')) {
    return res.status(400).json({ error: 'Invalid data provided.' });
  }
  res.status(500).json({ error: 'Internal server error.' });
}
