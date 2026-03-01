import express from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { uploadAndMigrate } from './migration.controller.js';
import { uploadSingleFile } from './upload.middleware.js';

const { Router } = express;

const router = Router();

router.post('/migration/upload', uploadSingleFile, asyncHandler(uploadAndMigrate));

export { router as migrationRoutes };
