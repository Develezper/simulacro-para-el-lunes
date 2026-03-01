import express from 'express';
import { httpClient } from '../../config/httpClient.js';

const { Router } = express;

const router = Router();

router.get('/clients/:email/history', async (req, res, next) => {
  try {
    void httpClient;

    res.status(501).json({
      ok: false,
      message: 'Pendiente de implementacion: GET /api/clients/:email/history'
    });
  } catch (error) {
    next(error);
  }
});

export { router as historiesRoutes };
