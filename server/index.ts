import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import { pool } from './db';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import inventoryRoutes from './routes/inventory';
import customerRoutes from './routes/customers';
import reservationRoutes from './routes/reservations';
import salesRoutes from './routes/sales';
import inspectionRoutes from './routes/inspections';
import uploadRoutes from './routes/uploads';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigin = process.env.APP_ORIGIN || 'http://localhost:3000';

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Return 404 for non-existent uploads (prevents SPA fallback)
app.use('/uploads/*', (_req, res) => {
  res.status(404).json({ error: 'File not found' });
});

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/uploads', uploadRoutes);

// API 404 handler: catch unknown /api/* routes and return JSON 404
// This must come AFTER all /api routes but BEFORE the SPA fallback
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Serve Vite production build as static files
const distDir = path.resolve('dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  // SPA fallback: return index.html for any non-API, non-file request.
  // This must come AFTER all /api routes and the API 404 handler.
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

app.listen(port, () => console.log(`My Budget PC API listening on port ${port}`));
