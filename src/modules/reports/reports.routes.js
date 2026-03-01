import express from 'express';

const { Router } = express;

const router = Router();

const pending = (feature) => (_req, res) => {
  res.status(501).json({
    ok: false,
    message: `Pendiente de implementacion: ${feature}`
  });
};

router.get('/reports/total-paid-by-client', pending('GET /api/reports/total-paid-by-client'));
router.get('/reports/pending-invoices', pending('GET /api/reports/pending-invoices'));
router.get('/reports/transactions-by-platform', pending('GET /api/reports/transactions-by-platform?platform=Nequi'));

export { router as reportsRoutes };
