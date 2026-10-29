import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { authenticate, authorize } from '../middleware/authenticate';
import { createAuditLog } from '../middleware/audit';
import { detectImageFormat } from '../../src/utils/imageFormat';
import { normalizeImageToWebp } from '../imageProcessing';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024) },
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
    const format = detectImageFormat(req.file.buffer);
    if (!format) {
      return res.status(400).json({ error: 'The uploaded file is not a supported image.' });
    }

    const uploadedFile = req.file;
    const processImage = async () => {
      let image: Buffer;
      try {
        image = await normalizeImageToWebp(uploadedFile.buffer);
      } catch {
        res.status(400).json({ error: 'The uploaded file could not be processed as an image.' });
        return;
      }

      const filename = `${randomUUID()}.webp`;
      const filepath = path.join(uploadDir, filename);
      try {
        await fs.promises.writeFile(filepath, image, { flag: 'wx' });
        await createAuditLog(req, 'IMAGE_UPLOADED', 'upload', undefined, {
          filename, size: image.byteLength, sourceFormat: format.extension,
        });
        res.json({ url: `/uploads/${filename}`, filename, size: image.byteLength });
      } catch (error) {
        try {
          await fs.promises.unlink(filepath);
        } catch (cleanupError) {
          if ((cleanupError as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error('Failed to clean up incomplete image upload:', cleanupError);
          }
        }
        console.error('Image upload storage error:', error);
        if (!res.headersSent) res.status(500).json({ error: 'The image could not be saved.' });
      }
    };
    void processImage();
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
