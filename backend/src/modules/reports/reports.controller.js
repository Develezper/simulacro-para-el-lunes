import {
  pendingInvoicesService,
  totalPaidByClientService,
  transactionsByPlatformService
} from './reports.service.js';

async function totalPaidByClient(_req, res) {
  const rows = await totalPaidByClientService();

  res.json({
    ok: true,
    data: rows
  });
}

async function pendingInvoices(_req, res) {
  const rows = await pendingInvoicesService();

  res.json({
    ok: true,
    data: rows
  });
}

async function transactionsByPlatform(req, res) {
  const rows = await transactionsByPlatformService(req.query.platform);

  res.json({
    ok: true,
    platform: req.query.platform,
    data: rows
  });
}

export { pendingInvoices, totalPaidByClient, transactionsByPlatform };
