import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';
import {
  upsertClientRecord,
  upsertInvoiceRecord,
  upsertPlatformRecord,
  upsertTransactionRecord
} from './migration.repository.js';
import { parseMigrationFile } from './parsers/migration.parser.js';
import { bulkUpsertClientHistories } from '../histories/histories.repository.js';
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

async function runWithConcurrency(items, limit, handler) {
  if (!items.length) return;

  const safeLimit = Math.max(1, Math.min(Number(limit) || 1, items.length));
  let cursor = 0;
  let firstError = null;

  const workers = Array.from({ length: safeLimit }, async () => {
    while (true) {
      if (firstError) return;

      const current = cursor;
      cursor += 1;

      if (current >= items.length) return;

      try {
        await handler(items[current], current);
      } catch (error) {
        firstError = error;
        return;
      }
    }
  });

  await Promise.all(workers);

  if (firstError) {
    throw firstError;
  }
}

function buildHistoryPayloads(rows) {
  const byClient = new Map();

  for (const row of rows) {
    const key = row.client.email;
    const tx = {
      txnCode: row.txnCode,
      date: row.txnDate,
      platform: row.platformName,
      invoiceNumber: row.invoice.invoiceNumber,
      amount: row.amount,
      status: row.status,
      transactionType: row.transactionType
    };

    if (!byClient.has(key)) {
      byClient.set(key, {
        clientEmail: key,
        clientName: row.client.fullName,
        transactions: [tx]
      });
      continue;
    }

    byClient.get(key).transactions.push(tx);
  }

  return [...byClient.values()];
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
    uniqueClients.add(row.client.identification);
    uniquePlatforms.add(row.platformName.toLowerCase());
    uniqueInvoices.add(row.invoice.invoiceNumber);
  }

  await runWithConcurrency(rows, env.migrationConcurrency, async (row) => {
    const clientId = await upsertClientRecord(row.client);

    const platformId = await upsertPlatformRecord(row.platformName);

    const invoiceId = await upsertInvoiceRecord({
      ...row.invoice,
      clientId
    });

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
  });

  await bulkUpsertClientHistories(buildHistoryPayloads(rows));

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
