import { createHttpError } from '../../utils/httpError.js';
import { migrateFromUploadedFile } from './migration.service.js';

async function uploadAndMigrate(req, res) {
  if (!req.file) {
    throw createHttpError(400, 'Debes adjuntar un archivo en el campo file');
  }

  const result = await migrateFromUploadedFile(req.file);

  res.status(201).json({
    ok: true,
    message: 'Migracion ejecutada correctamente',
    file: req.file.filename,
    summary: result.summary,
    normalizationSummary: result.normalizationSummary,
    normalizationEvidenceFile: result.evidencePath
  });
}

export { uploadAndMigrate };
