import fs from 'node:fs/promises';
import path from 'node:path';
import { parseDelimitedWithQuotes, rowsToObjects } from '../../../utils/delimitedParser.js';
import { createHttpError } from '../../../utils/httpError.js';

const REQUIRED_HEADERS = {
  txCode: 'ID de la Transacción',
  txDate: 'Fecha y Hora de la Transacción',
  txAmount: 'Monto de la Transacción',
  txStatus: 'Estado de la Transacción',
  txType: 'Tipo de Transacción',
  clientName: 'Nombre del Cliente',
  identification: 'Número de Identificación',
  address: 'Dirección',
  phone: 'Teléfono',
  email: 'Correo Electrónico',
  platform: 'Plataforma Utilizada',
  invoiceNumber: 'Número de Factura',
  billingPeriod: 'Periodo de Facturación',
  billedAmount: 'Monto Facturado',
  paidAmount: 'Monto Pagado'
};

function parseNumber(value, fieldName) {
  const normalized = String(value ?? '').replace(/[^0-9.-]/g, '');
  const num = Number(normalized);

  if (!Number.isFinite(num)) {
    throw createHttpError(400, `No se pudo convertir ${fieldName} a numero: ${value}`);
  }

  return num;
}

function parseText(value, fieldName) {
  const text = String(value ?? '').trim();

  if (!text) {
    throw createHttpError(400, `El valor de ${fieldName} no puede estar vacio`);
  }

  return text;
}

function formatDateTimeUtc(date) {
  const pad = (num) => String(num).padStart(2, '0');

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function parseTransactionDate(value, fieldName) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel serial date (days since 1899-12-30, including fractional day for time)
    const excelEpochMs = Date.UTC(1899, 11, 30);
    const dateMs = Math.round(excelEpochMs + (value * 24 * 60 * 60 * 1000));
    const date = new Date(dateMs);
    return formatDateTimeUtc(date);
  }

  const text = parseText(value, fieldName);

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDateTimeUtc(parsed);
  }

  throw createHttpError(400, `No se pudo convertir ${fieldName} a fecha valida: ${value}`);
}

function normalizeRawRows(rawRows) {
  return rawRows.map((row, index) => {
    try {
      return {
        txnCode: parseText(row[REQUIRED_HEADERS.txCode], REQUIRED_HEADERS.txCode),
        txnDate: parseTransactionDate(row[REQUIRED_HEADERS.txDate], REQUIRED_HEADERS.txDate),
        amount: parseNumber(row[REQUIRED_HEADERS.txAmount], REQUIRED_HEADERS.txAmount),
        status: parseText(row[REQUIRED_HEADERS.txStatus], REQUIRED_HEADERS.txStatus),
        transactionType: parseText(row[REQUIRED_HEADERS.txType], REQUIRED_HEADERS.txType),
        client: {
          fullName: parseText(row[REQUIRED_HEADERS.clientName], REQUIRED_HEADERS.clientName),
          identification: parseText(row[REQUIRED_HEADERS.identification], REQUIRED_HEADERS.identification),
          address: parseText(row[REQUIRED_HEADERS.address], REQUIRED_HEADERS.address),
          phone: parseText(row[REQUIRED_HEADERS.phone], REQUIRED_HEADERS.phone),
          email: parseText(row[REQUIRED_HEADERS.email], REQUIRED_HEADERS.email).toLowerCase()
        },
        platformName: parseText(row[REQUIRED_HEADERS.platform], REQUIRED_HEADERS.platform),
        invoice: {
          invoiceNumber: parseText(row[REQUIRED_HEADERS.invoiceNumber], REQUIRED_HEADERS.invoiceNumber),
          billingPeriod: parseText(row[REQUIRED_HEADERS.billingPeriod], REQUIRED_HEADERS.billingPeriod),
          billedAmount: parseNumber(row[REQUIRED_HEADERS.billedAmount], REQUIRED_HEADERS.billedAmount),
          paidAmount: parseNumber(row[REQUIRED_HEADERS.paidAmount], REQUIRED_HEADERS.paidAmount)
        }
      };
    } catch (error) {
      error.details = {
        rowNumber: index + 2
      };

      throw error;
    }
  });
}

function assertHeaders(rawRows) {
  if (!rawRows.length) {
    throw createHttpError(400, 'El archivo no contiene filas');
  }

  const headers = Object.keys(rawRows[0]);
  const missing = Object.values(REQUIRED_HEADERS).filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    throw createHttpError(400, 'El archivo no tiene todas las columnas requeridas', { missing });
  }
}

async function parseTextLikeFile(filePath, delimiter) {
  const content = await fs.readFile(filePath, 'utf8');
  const rows = parseDelimitedWithQuotes(content, { delimiter });
  return rowsToObjects(rows);
}

async function parseXlsxFile(filePath) {
  let xlsx;

  try {
    const xlsxModule = await import('xlsx');
    xlsx = xlsxModule.default ?? xlsxModule;
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      throw createHttpError(500, 'Dependencia xlsx no instalada. Ejecuta: npm install xlsx');
    }

    throw error;
  }

  const workbook = xlsx.readFile(filePath, { cellDates: false });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw createHttpError(400, 'El archivo xlsx no contiene hojas');
  }

  return xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: '' });
}

async function parseMigrationFile(file) {
  const extension = path.extname(file.originalname || file.filename).toLowerCase();
  let rawRows;

  if (extension === '.xlsx') {
    rawRows = await parseXlsxFile(file.path);
  } else if (extension === '.csv') {
    rawRows = await parseTextLikeFile(file.path, ',');
  } else if (extension === '.txt' || extension === '.tsv') {
    rawRows = await parseTextLikeFile(file.path, '\t');
  } else {
    throw createHttpError(400, 'Extension no soportada. Usa .xlsx, .csv, .txt o .tsv');
  }

  assertHeaders(rawRows);

  return normalizeRawRows(rawRows);
}

export { parseMigrationFile };
