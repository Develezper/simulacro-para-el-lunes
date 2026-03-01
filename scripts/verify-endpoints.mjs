import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3000/api';
const MIGRATION_FILE = process.env.VERIFY_MIGRATION_FILE || '';

async function requestJson(route, { method = 'GET', body, expected = [200], headers = {} } = {}) {
  const response = await fetch(`${BASE_URL}${route}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? JSON.parse(text || '{}') : text;

  if (!expected.includes(response.status)) {
    throw new Error(`Fallo ${method} ${route} -> status ${response.status}. Respuesta: ${text}`);
  }

  return { status: response.status, data };
}

function logStep(message) {
  process.stdout.write(`\n[verify] ${message}\n`);
}

async function verifyHealth() {
  logStep('Health check');
  await requestJson('/health');
}

async function verifyCrudClients() {
  logStep('CRUD clients');

  const seed = `${Date.now()}`;
  const payload = {
    identification: `TEST-${seed}`,
    full_name: `Cliente Test ${seed}`,
    email: `test_${seed}@mail.com`,
    phone: '3000000000',
    address: 'Calle Test #1-23'
  };

  const created = await requestJson('/clients', {
    method: 'POST',
    expected: [201],
    body: payload
  });

  const clientId = created.data?.data?.id;

  if (!clientId) {
    throw new Error('No se pudo obtener id del cliente creado');
  }

  await requestJson(`/clients/${clientId}`);

  await requestJson(`/clients/${clientId}`, {
    method: 'PUT',
    body: {
      phone: '3111111111',
      address: 'Calle Actualizada #45-67'
    }
  });

  const listed = await requestJson('/clients');
  const exists = Array.isArray(listed.data?.data) && listed.data.data.some((item) => item.id === clientId);

  if (!exists) {
    throw new Error('El cliente creado no aparece en el listado');
  }

  await requestJson(`/clients/${clientId}`, {
    method: 'DELETE'
  });

  await requestJson(`/clients/${clientId}`, {
    expected: [404]
  });
}

async function verifyReports() {
  logStep('Reportes SQL');

  await requestJson('/reports/total-paid-by-client');
  await requestJson('/reports/pending-invoices');
  await requestJson('/reports/transactions-by-platform?platform=Nequi');
}

async function verifyHistory() {
  logStep('Historial Mongo');

  await requestJson('/clients/rmiller@boyer.com/history', {
    expected: [200, 404]
  });
}

async function verifyMigration() {
  if (!MIGRATION_FILE) {
    logStep('Migracion omitida (define VERIFY_MIGRATION_FILE para probarla)');
    return;
  }

  logStep(`Migracion con archivo: ${MIGRATION_FILE}`);

  const filePath = path.resolve(process.cwd(), MIGRATION_FILE);
  const content = await fs.readFile(filePath);

  const form = new FormData();
  const extension = path.extname(filePath).toLowerCase();
  const contentType = extension === '.csv' ? 'text/csv' : 'text/plain';

  form.append('file', new Blob([content], { type: contentType }), path.basename(filePath));

  const response = await fetch(`${BASE_URL}/migration/upload`, {
    method: 'POST',
    body: form
  });

  const text = await response.text();

  if (response.status !== 201) {
    throw new Error(`Fallo migracion -> status ${response.status}. Respuesta: ${text}`);
  }
}

async function main() {
  process.stdout.write(`[verify] Base URL: ${BASE_URL}\n`);

  await verifyHealth();
  await verifyCrudClients();
  await verifyReports();
  await verifyHistory();
  await verifyMigration();

  process.stdout.write('\n[verify] Todo OK\n');
}

main().catch((error) => {
  process.stderr.write(`\n[verify] ERROR: ${error.message}\n`);
  process.exitCode = 1;
});
