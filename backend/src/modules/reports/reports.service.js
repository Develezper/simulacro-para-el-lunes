import {
  getPendingInvoicesRows,
  getTotalPaidByClientRows,
  getTransactionsByPlatformRows
} from './reports.repository.js';
import { createHttpError } from '../../utils/httpError.js';

async function totalPaidByClientService() {
  return getTotalPaidByClientRows();
}

async function pendingInvoicesService() {
  return getPendingInvoicesRows();
}

async function transactionsByPlatformService(rawPlatform) {
  const platform = String(rawPlatform || '').trim();

  if (!platform) {
    throw createHttpError(400, 'Debes enviar el query param platform. Ejemplo: /api/reports/transactions-by-platform?platform=Nequi');
  }

  return getTransactionsByPlatformRows(platform);
}

export {
  pendingInvoicesService,
  totalPaidByClientService,
  transactionsByPlatformService
};
