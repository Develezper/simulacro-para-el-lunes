import express from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  pendingInvoices,
  totalPaidByClient,
  transactionsByPlatform
} from './reports.controller.js';

const { Router } = express;

const router = Router();

router.get('/reports/total-paid-by-client', asyncHandler(totalPaidByClient));
router.get('/reports/pending-invoices', asyncHandler(pendingInvoices));
router.get('/reports/transactions-by-platform', asyncHandler(transactionsByPlatform));

export { router as reportsRoutes };
