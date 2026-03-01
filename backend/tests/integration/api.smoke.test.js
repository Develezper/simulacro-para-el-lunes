import test from 'node:test';
import assert from 'node:assert/strict';
import { getHealth } from '../../src/modules/health/health.controller.js';
import { validateClientId, validateClientPayload } from '../../src/modules/clients/clients.validation.js';
import { transactionsByPlatformService } from '../../src/modules/reports/reports.service.js';
import { getClientHistoryByEmailService } from '../../src/modules/histories/histories.service.js';
import { parseMigrationFile } from '../../src/modules/migration/parsers/migration.parser.js';
import { normalizeRows } from '../../normalizacion.js';

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('health controller responde payload esperado', () => {
  const res = createMockRes();

  getHealth({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.service, 'simulacro-backend');
  assert.ok(typeof res.body.timestamp === 'string' && res.body.timestamp.length > 0);
});

test('validateClientId rechaza id invalido', () => {
  assert.throws(
    () => validateClientId('abc'),
    /entero positivo/i
  );
});

test('validateClientPayload valida campos requeridos', () => {
  assert.throws(
    () => validateClientPayload({ full_name: 'A' }),
    /obligatorio/i
  );
});

test('transactionsByPlatformService exige query param platform', async () => {
  await assert.rejects(
    () => transactionsByPlatformService(''),
    /query param platform/i
  );
});

test('history service valida formato de email', async () => {
  await assert.rejects(
    () => getClientHistoryByEmailService('not-an-email'),
    /email valido/i
  );
});

test('parser de migracion procesa data.txt (100 filas)', async () => {
  const rows = await parseMigrationFile({
    path: 'uploads/data.txt',
    originalname: 'data.txt',
    filename: 'data.txt'
  });

  assert.equal(rows.length, 100);
  assert.equal(rows[0].txnCode, 'TXN001');
  assert.equal(rows[0].client.email, 'rmiller@boyer.com');
});

test('normalizacion genera colecciones deduplicadas', async () => {
  const rows = await parseMigrationFile({
    path: 'uploads/data.txt',
    originalname: 'data.txt',
    filename: 'data.txt'
  });

  const normalized = normalizeRows(rows);

  assert.equal(normalized.summary.processed_rows, 100);
  assert.equal(normalized.summary.unique_clients, 100);
  assert.equal(normalized.summary.unique_platforms, 2);
  assert.equal(normalized.summary.unique_invoices, 100);
  assert.equal(normalized.summary.unique_transactions, 100);
});
