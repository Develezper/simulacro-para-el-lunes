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

const REQUIRED_HEADER_VALUES = Object.values(REQUIRED_HEADERS);
const NORMALIZED_HEADERS = new Set(REQUIRED_HEADER_VALUES.map((header) => normalizeToken(header)));
const TRANSACTION_STATUS_MAP = new Map([
  ['pendiente', 'Pending'],
  ['pending', 'Pending'],
  ['completada', 'Completed'],
  ['completed', 'Completed'],
  ['fallida', 'Failed'],
  ['failed', 'Failed']
]);

function normalizeToken(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

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

function normalizeTransactionStatus(value, fieldName) {
  const rawValue = parseText(value, fieldName);
  const normalizedKey = normalizeToken(rawValue);
  const mapped = TRANSACTION_STATUS_MAP.get(normalizedKey);

  if (!mapped) {
    throw createHttpError(
      400,
      `Estado de transaccion no soportado en ${fieldName}: ${rawValue}`
    );
  }

  return mapped;
}

function isRowCompletelyEmpty(row) {
  return Object.values(REQUIRED_HEADERS).every((header) => {
    const value = row?.[header];

    if (value === null || value === undefined) return true;
    return String(value).trim() === '';
  });
}

function isTechnicalNoiseRow(row) {
  const txCodeValue = String(row?.[REQUIRED_HEADERS.txCode] ?? '').trim();
  const nonEmptyValues = REQUIRED_HEADER_VALUES.map((header) => String(row?.[header] ?? '').trim()).filter(Boolean);

  if (!nonEmptyValues.length) return true;

  const normalizedValues = nonEmptyValues.map((value) => normalizeToken(value));
  const headerMatches = normalizedValues.filter((value) => NORMALIZED_HEADERS.has(value)).length;

  // Repeated headers or metadata-like rows accidentally embedded in the file.
  if (headerMatches >= Math.max(3, Math.floor(nonEmptyValues.length * 0.6))) {
    return true;
  }

  // Rows without transaction code that only contain ID-like placeholders.
  if (!txCodeValue && normalizedValues.every((value) => value.startsWith('id'))) {
    return true;
  }

  return false;
}

function normalizeRawRows(rawRowsWithPosition) {
  return rawRowsWithPosition.map(({ row, rowNumber }) => {
    try {
      return {
        txnCode: parseText(row[REQUIRED_HEADERS.txCode], REQUIRED_HEADERS.txCode),
        txnDate: parseTransactionDate(row[REQUIRED_HEADERS.txDate], REQUIRED_HEADERS.txDate),
        amount: parseNumber(row[REQUIRED_HEADERS.txAmount], REQUIRED_HEADERS.txAmount),
        status: normalizeTransactionStatus(
          row[REQUIRED_HEADERS.txStatus],
          REQUIRED_HEADERS.txStatus
        ),
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
        rowNumber
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

async function parseDelimitedFile(filePath, extension) {
  const content = await fs.readFile(filePath, 'utf8');
  const delimiter = extension === '.csv' ? ',' : '\t';
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
  } else if (extension === '.csv' || extension === '.txt' || extension === '.tsv') {
    rawRows = await parseDelimitedFile(file.path, extension);
  } else {
    throw createHttpError(400, 'Extension no soportada. Usa .xlsx, .csv, .txt o .tsv');
  }

  assertHeaders(rawRows);

  const rowsWithPosition = rawRows
    .map((row, index) => ({
      row,
      rowNumber: index + 2
    }))
    .filter(({ row }) => !isRowCompletelyEmpty(row))
    .filter(({ row }) => !isTechnicalNoiseRow(row));

  if (!rowsWithPosition.length) {
    throw createHttpError(400, 'El archivo no contiene filas con datos');
  }

  return normalizeRawRows(rowsWithPosition);
}

export { parseMigrationFile };
