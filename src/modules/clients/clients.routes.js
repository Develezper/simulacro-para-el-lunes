import express from 'express';

const { Router } = express;

const router = Router();

const pending = (feature) => (_req, res) => {
  res.status(501).json({
    ok: false,
    message: `Pendiente de implementacion: ${feature}`
  });
};

router.get('/clients', pending('GET /api/clients'));
router.get('/clients/:id', pending('GET /api/clients/:id'));
router.post('/clients', pending('POST /api/clients'));
router.put('/clients/:id', pending('PUT /api/clients/:id'));
router.delete('/clients/:id', pending('DELETE /api/clients/:id'));

export { router as clientsRoutes };
