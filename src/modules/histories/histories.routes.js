import express from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getClientHistory } from './histories.controller.js';

const { Router } = express;

const router = Router();

router.get('/clients/:email/history', asyncHandler(getClientHistory));

export { router as historiesRoutes };
