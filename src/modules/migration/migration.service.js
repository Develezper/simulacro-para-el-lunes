import {
  upsertClientRecord,
  upsertInvoiceRecord,
  upsertPlatformRecord,
  upsertTransactionRecord
} from './migration.repository.js';
import { parseMigrationFile } from './parsers/migration.parser.js';
import { upsertClientHistoryTransaction } from '../histories/histories.repository.js';

async function migrateFromUploadedFile(file) {
  const rows = await parseMigrationFile(file);

  const summary = {
    processedRows: rows.length,
    clientsUpserted: 0,
    platformsUpserted: 0,
    invoicesUpserted: 0,
    transactionsUpserted: 0,
    historiesUpserted: 0
  };

  const uniqueClients = new Set();
  const uniquePlatforms = new Set();
  const uniqueInvoices = new Set();

  for (const row of rows) {
    const clientId = await upsertClientRecord(row.client);
    uniqueClients.add(row.client.identification);

    const platformId = await upsertPlatformRecord(row.platformName);
    uniquePlatforms.add(row.platformName.toLowerCase());

    const invoiceId = await upsertInvoiceRecord({
      ...row.invoice,
      clientId
    });
    uniqueInvoices.add(row.invoice.invoiceNumber);

    await upsertTransactionRecord({
      txnCode: row.txnCode,
      txnDate: row.txnDate,
      amount: row.amount,
      status: row.status,
      transactionType: row.transactionType,
      clientId,
      platformId,
      invoiceId
    });

    await upsertClientHistoryTransaction({
      clientEmail: row.client.email,
      clientName: row.client.fullName,
      transaction: {
        txnCode: row.txnCode,
        date: row.txnDate,
        platform: row.platformName,
        invoiceNumber: row.invoice.invoiceNumber,
        amount: row.amount,
        status: row.status,
        transactionType: row.transactionType
      }
    });
  }

  summary.clientsUpserted = uniqueClients.size;
  summary.platformsUpserted = uniquePlatforms.size;
  summary.invoicesUpserted = uniqueInvoices.size;
  summary.transactionsUpserted = rows.length;
  summary.historiesUpserted = uniqueClients.size;

  return summary;
}

export { migrateFromUploadedFile };
