import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseMigrationFile } from './src/modules/migration/parsers/migration.parser.js';

function deriveInvoiceStatus(billedAmount, paidAmount) {
  if (paidAmount <= 0) {
    return 'Pending';
  }

  if (paidAmount < billedAmount) {
    return 'Partial';
  }

  return 'Paid';
}

function normalizeRows(rows) {
  const clientsByIdentification = new Map();
  const platformsByName = new Map();
  const invoicesByNumber = new Map();
  const transactions = [];

  for (const row of rows) {
    const clientKey = row.client.identification;
    const platformKey = row.platformName.trim().toLowerCase();
    const invoiceKey = row.invoice.invoiceNumber;

    if (!clientsByIdentification.has(clientKey)) {
      clientsByIdentification.set(clientKey, {
        identification: row.client.identification,
        full_name: row.client.fullName,
        email: row.client.email,
        phone: row.client.phone,
        address: row.client.address
      });
    }

    if (!platformsByName.has(platformKey)) {
      platformsByName.set(platformKey, {
        name: row.platformName.trim()
      });
    }

    invoicesByNumber.set(invoiceKey, {
      invoice_number: row.invoice.invoiceNumber,
      billing_period: row.invoice.billingPeriod,
      billed_amount: row.invoice.billedAmount,
      paid_amount: row.invoice.paidAmount,
      status: deriveInvoiceStatus(row.invoice.billedAmount, row.invoice.paidAmount),
      client_identification: row.client.identification
    });

    transactions.push({
      txn_code: row.txnCode,
      txn_date: row.txnDate,
      amount: row.amount,
      status: row.status,
      transaction_type: row.transactionType,
      client_identification: row.client.identification,
      platform_name: row.platformName,
      invoice_number: row.invoice.invoiceNumber
    });
  }

  return {
    summary: {
      processed_rows: rows.length,
      unique_clients: clientsByIdentification.size,
      unique_platforms: platformsByName.size,
      unique_invoices: invoicesByNumber.size,
      unique_transactions: transactions.length
    },
    clients: Array.from(clientsByIdentification.values()),
    platforms: Array.from(platformsByName.values()),
    invoices: Array.from(invoicesByNumber.values()),
    transactions
  };
}

function parseCliArgs(argv) {
  const args = [...argv];
  let input = null;
  let output = null;

  if (args.length > 0 && !args[0].startsWith('--')) {
    input = args.shift();
  }

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--out' && args[i + 1]) {
      output = args[i + 1];
      i += 1;
    }
  }

  return { input, output };
}

async function resolveDefaultInputPath() {
  const preferred = [
    'uploads/data.xlsx',
    'uploads/data.txt'
  ];

  for (const candidate of preferred) {
    try {
      await fs.access(path.resolve(process.cwd(), candidate));
      return candidate;
    } catch (_error) {
      // continue
    }
  }

  throw new Error('No se encontro archivo por defecto. Pasa una ruta explicita, por ejemplo: node normalizacion.js uploads/data.xlsx');
}

async function runNormalization({ input, output }) {
  const filePath = input || await resolveDefaultInputPath();
  const absoluteInput = path.resolve(process.cwd(), filePath);
  const baseName = path.basename(absoluteInput);

  const parsedRows = await parseMigrationFile({
    path: absoluteInput,
    originalname: baseName,
    filename: baseName
  });

  const normalized = normalizeRows(parsedRows);

  if (output) {
    const absoluteOutput = path.resolve(process.cwd(), output);
    await fs.mkdir(path.dirname(absoluteOutput), { recursive: true });
    await fs.writeFile(absoluteOutput, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  }

  return {
    input: filePath,
    output,
    ...normalized
  };
}

async function runCli() {
  const args = parseCliArgs(process.argv.slice(2));
  const result = await runNormalization(args);

  process.stdout.write(`Archivo normalizado: ${result.input}\n`);
  if (result.output) {
    process.stdout.write(`Salida JSON: ${result.output}\n`);
  }
  process.stdout.write(`Filas procesadas: ${result.summary.processed_rows}\n`);
  process.stdout.write(`Clientes unicos: ${result.summary.unique_clients}\n`);
  process.stdout.write(`Plataformas unicas: ${result.summary.unique_platforms}\n`);
  process.stdout.write(`Facturas unicas: ${result.summary.unique_invoices}\n`);
  process.stdout.write(`Transacciones: ${result.summary.unique_transactions}\n`);
}

const isDirectExecution = import.meta.url === pathToFileURL(process.argv[1] || '').href;

if (isDirectExecution) {
  runCli().catch((error) => {
    process.stderr.write(`[normalizacion] ERROR: ${error.message}\n`);
    process.exitCode = 1;
  });
}

export { normalizeRows, runNormalization };
