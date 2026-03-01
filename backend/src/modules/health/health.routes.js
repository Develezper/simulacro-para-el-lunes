import express from 'express';
import { getHealth } from './health.controller.js';

const { Router } = express;

const router = Router();

router.get('/health', getHealth);

export { router as healthRoutes };
