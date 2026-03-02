import { apiRequest } from '../shared/apiClient.js';
import { initializeShell } from '../shared/appShell.js';
import { clearMessage, setButtonLoading, showMessage } from '../shared/ui.js';

initializeShell('migration');

const form = document.getElementById('migrationForm');
const fileInput = document.getElementById('migrationFile');
const submitButton = document.getElementById('btnMigrationUpload');
const messageBox = document.getElementById('pageMessage');
const resultOutput = document.getElementById('migrationOutput');

const SUMMARY_LABELS = {
  processedRows: 'Filas procesadas',
  clientsUpserted: 'Clientes',
  platformsUpserted: 'Plataformas',
  invoicesUpserted: 'Facturas',
  transactionsUpserted: 'Transacciones',
  historiesUpserted: 'Historiales'
};

const NORMALIZATION_LABELS = {
  processed_rows: 'Filas fuente',
  unique_clients: 'Clientes unicos',
  unique_platforms: 'Plataformas unicas',
  unique_invoices: 'Facturas unicas',
  unique_transactions: 'Transacciones unicas'
};

function isValidFile(file) {
  return file && /\.(xlsx|csv|txt|tsv)$/i.test(file.name);
}

function normalizeText(value, fallback = 'No disponible') {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function formatCount(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return normalizeText(value);
  }

  return new Intl.NumberFormat('es-CO').format(number);
}

function clearResultOutput() {
  resultOutput.textContent = '';
}

function appendMetaItem(container, label, value, options = {}) {
  const { mono = false, href = '' } = options;
  const row = document.createElement('div');
  row.className = 'result-meta-item';

  const title = document.createElement('dt');
  title.textContent = label;

  const content = document.createElement('dd');
  if (mono) {
    content.classList.add('mono-value');
  }

  if (href) {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = normalizeText(value);
    content.appendChild(link);
  } else {
    content.textContent = normalizeText(value);
  }

  row.append(title, content);
  container.appendChild(row);
}

function createStatsSection(titleText, values, labelMap) {
  const section = document.createElement('section');
  section.className = 'result-section';

  const title = document.createElement('h3');
  title.textContent = titleText;
  section.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'stats-grid';

  const entries = Object.entries(values || {});

  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Sin datos en esta seccion.';
    section.appendChild(empty);
    return section;
  }

  for (const [key, rawValue] of entries) {
    const statCard = document.createElement('article');
    statCard.className = 'stat-card';

    const label = document.createElement('p');
    label.className = 'stat-label';
    label.textContent = labelMap[key] || key;

    const value = document.createElement('p');
    value.className = 'stat-value';
    value.textContent = formatCount(rawValue);

    statCard.append(label, value);
    grid.appendChild(statCard);
  }

  section.appendChild(grid);
  return section;
}

function renderSuccessResult(response) {
  clearResultOutput();

  const container = document.createElement('article');
  container.className = 'result-card';

  const header = document.createElement('header');
  header.className = 'result-header';

  const titleBlock = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = 'Migracion completada';
  const message = document.createElement('p');
  message.className = 'result-subtitle';
  message.textContent = normalizeText(response.message, 'Migracion ejecutada correctamente');
  titleBlock.append(title, message);

  const statusPill = document.createElement('span');
  statusPill.className = 'status-pill is-success';
  statusPill.textContent = `HTTP ${normalizeText(response.status, '201')}`;

  header.append(titleBlock, statusPill);
  container.appendChild(header);

  const meta = document.createElement('dl');
  meta.className = 'result-meta';
  appendMetaItem(meta, 'Archivo cargado', response.file);
  appendMetaItem(meta, 'Endpoint', response.url, {
    mono: true,
    href: /^https?:\/\//i.test(String(response.url || '')) ? response.url : ''
  });
  appendMetaItem(meta, 'Evidencia de normalizacion', response.normalizationEvidenceFile, { mono: true });
  container.appendChild(meta);

  container.appendChild(createStatsSection('Resumen de proceso', response.summary, SUMMARY_LABELS));
  container.appendChild(
    createStatsSection('Resumen de normalizacion', response.normalizationSummary, NORMALIZATION_LABELS)
  );

  resultOutput.appendChild(container);
}

function formatErrorDetails(details) {
  if (!details) return '';
  if (typeof details === 'string') return details;
  if (Array.isArray(details)) return details.map((item) => normalizeText(item)).join(' | ');
  if (typeof details === 'object') {
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : normalizeText(value)}`)
      .join(' | ');
  }

  return normalizeText(details);
}

function renderErrorResult(error) {
  clearResultOutput();

  const container = document.createElement('article');
  container.className = 'result-card';

  const header = document.createElement('header');
  header.className = 'result-header';

  const titleBlock = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = 'Migracion con error';
  const message = document.createElement('p');
  message.className = 'result-subtitle';
  message.textContent = normalizeText(error.message, 'No se pudo ejecutar la migracion.');
  titleBlock.append(title, message);

  const statusPill = document.createElement('span');
  statusPill.className = 'status-pill is-error';
  statusPill.textContent = `HTTP ${normalizeText(error.status, '500')}`;

  header.append(titleBlock, statusPill);
  container.appendChild(header);

  const meta = document.createElement('dl');
  meta.className = 'result-meta';
  appendMetaItem(meta, 'Endpoint', error.url, {
    mono: true,
    href: /^https?:\/\//i.test(String(error.url || '')) ? error.url : ''
  });
  appendMetaItem(meta, 'Detalle', formatErrorDetails(error.details) || 'Sin detalle adicional');
  container.appendChild(meta);

  resultOutput.appendChild(container);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(messageBox);

  const file = fileInput.files?.[0];

  if (!isValidFile(file)) {
    showMessage(messageBox, {
      type: 'error',
      message: 'Archivo invalido. Debe ser .xlsx, .csv, .txt o .tsv'
    });
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    setButtonLoading(submitButton, true, 'Subiendo...');

    const response = await apiRequest('/migration/upload', {
      method: 'POST',
      body: formData,
      timeoutMs: 180000
    });

    renderSuccessResult(response);
    showMessage(messageBox, {
      type: 'success',
      message: response.message || 'Migracion ejecutada correctamente.'
    });
  } catch (error) {
    renderErrorResult(error);
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No se pudo ejecutar la migracion.',
      details: error.details || ''
    });
  } finally {
    setButtonLoading(submitButton, false);
  }
});
