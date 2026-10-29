import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { authenticate, authorize } from '../middleware/authenticate';
import { createAuditLog } from '../middleware/audit';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
});

// POST /api/uploads/image
router.post('/image', authenticate, authorize('admin', 'sales'), (req: Request, res: Response) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum 5MB.' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }
    const url = `/uploads/${req.file.filename}`;
    createAuditLog(req, 'IMAGE_UPLOADED', 'upload', undefined, {
      filename: req.file.filename, size: req.file.size,
    });
    res.json({ url, filename: req.file.filename, size: req.file.size });
  });
});

// DELETE /api/uploads/:filename
router.delete('/:filename', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    if (/[^a-zA-Z0-9._-]/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename.' });
    }
    const filepath = path.resolve(uploadDir, filename);
    const resolvedDir = path.resolve(uploadDir);
    if (!filepath.startsWith(resolvedDir + path.sep) && filepath !== resolvedDir) {
      return res.status(400).json({ error: 'Invalid filename.' });
    }
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    await createAuditLog(req, 'FILE_DELETED', 'upload', undefined, { filename });
    res.json({ message: 'File deleted.' });
  } catch (err) {
    console.error('Upload delete error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
