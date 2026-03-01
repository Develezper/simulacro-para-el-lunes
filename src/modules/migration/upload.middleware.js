import fs from 'node:fs/promises';
import path from 'node:path';
import { createHttpError } from '../../utils/httpError.js';

const allowedExtensions = new Set(['.xlsx', '.csv', '.txt', '.tsv']);

function buildFileName(originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  const safe = path.basename(originalname || 'upload', ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || 'upload';
  return `${Date.now()}-${safe}${ext || '.tmp'}`;
}

async function uploadSingleFile(req, res, next) {
  try {
    let multer;

    try {
      const multerModule = await import('multer');
      multer = multerModule.default ?? multerModule;
    } catch (error) {
      if (error?.code === 'ERR_MODULE_NOT_FOUND') {
        throw createHttpError(500, 'Dependencia multer no instalada. Ejecuta: npm install multer');
      }

      throw error;
    }

    const uploadDir = path.resolve(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => cb(null, buildFileName(file.originalname))
    });

    const upload = multer({
      storage,
      limits: {
        fileSize: 20 * 1024 * 1024
      },
      fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();

        if (!allowedExtensions.has(ext)) {
          cb(createHttpError(400, 'Tipo de archivo invalido. Solo se permiten .xlsx, .csv, .txt, .tsv'));
          return;
        }

        cb(null, true);
      }
    }).single('file');

    upload(req, res, (error) => {
      if (error) {
        next(error);
        return;
      }

      next();
    });
  } catch (error) {
    next(error);
  }
}

export { uploadSingleFile };
