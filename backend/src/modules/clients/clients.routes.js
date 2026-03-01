import express from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createClient,
  deleteClient,
  getClient,
  getClients,
  updateClient
} from './clients.controller.js';

const { Router } = express;

const router = Router();

router.get('/clients', asyncHandler(getClients));
router.get('/clients/:id', asyncHandler(getClient));
router.post('/clients', asyncHandler(createClient));
router.put('/clients/:id', asyncHandler(updateClient));
router.delete('/clients/:id', asyncHandler(deleteClient));

export { router as clientsRoutes };
