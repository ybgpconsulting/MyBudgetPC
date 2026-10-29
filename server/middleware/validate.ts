import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req[source] = result.data;
    next();
  };
}
