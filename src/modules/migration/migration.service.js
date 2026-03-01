import fs from 'node:fs/promises';
import path from 'node:path';
import {
  upsertClientRecord,
  upsertInvoiceRecord,
  upsertPlatformRecord,
  upsertTransactionRecord
} from './migration.repository.js';
import { parseMigrationFile } from './parsers/migration.parser.js';
import { upsertClientHistoryTransaction } from '../histories/histories.repository.js';
import { normalizeRows } from '../../../normalizacion.js';

function buildEvidenceFileName(file) {
  const baseName = path.basename(file?.originalname || file?.filename || 'upload');
  const ext = path.extname(baseName);
  const rawName = baseName.slice(0, baseName.length - ext.length) || 'upload';
  const safeName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  return `normalizado-${stamp}-${safeName}.json`;
}

async function writeNormalizationEvidence(file, normalizedData) {
  const evidenceDir = path.resolve(process.cwd(), 'uploads', 'evidencias');
  await fs.mkdir(evidenceDir, { recursive: true });

  const evidenceFileName = buildEvidenceFileName(file);
  const evidenceAbsolutePath = path.join(evidenceDir, evidenceFileName);
  const evidenceRelativePath = path.join('uploads', 'evidencias', evidenceFileName);

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceFile: {
      originalname: file?.originalname || null,
      filename: file?.filename || null,
      size: file?.size ?? null,
      mimetype: file?.mimetype || null
    },
    summary: normalizedData.summary,
    normalized: {
      clients: normalizedData.clients,
      platforms: normalizedData.platforms,
      invoices: normalizedData.invoices,
      transactions: normalizedData.transactions
    }
  };

  await fs.writeFile(evidenceAbsolutePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return evidenceRelativePath;
}

async function migrateFromUploadedFile(file) {
  const rows = await parseMigrationFile(file);
  const normalizedData = normalizeRows(rows);

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
  const evidencePath = await writeNormalizationEvidence(file, normalizedData);

  return {
    summary,
    evidencePath,
    normalizationSummary: normalizedData.summary
  };
}

export { migrateFromUploadedFile };
