import express from 'express';
import { healthRoutes } from '../modules/health/health.routes.js';
import { clientsRoutes } from '../modules/clients/clients.routes.js';
import { reportsRoutes } from '../modules/reports/reports.routes.js';
import { historiesRoutes } from '../modules/histories/histories.routes.js';

const { Router } = express;

const apiRoutes = Router();

apiRoutes.use(healthRoutes);
apiRoutes.use(clientsRoutes);
apiRoutes.use(reportsRoutes);
apiRoutes.use(historiesRoutes);

export { apiRoutes };
