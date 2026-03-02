import { apiRequest } from '../shared/apiClient.js';
import { initializeShell } from '../shared/appShell.js';
import { clearMessage, showMessage } from '../shared/ui.js';

initializeShell('dashboard');

const healthButton = document.getElementById('btnCheckHealth');
const healthOutput = document.getElementById('healthOutput');
const messageBox = document.getElementById('pageMessage');

function normalizeText(value, fallback = 'No disponible') {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function formatDetails(details) {
  if (!details) return 'Sin detalle adicional';
  if (typeof details === 'string') return details;
  if (Array.isArray(details)) return details.map((item) => normalizeText(item)).join(' | ');
  if (typeof details === 'object') {
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : normalizeText(value)}`)
      .join(' | ');
  }
  return normalizeText(details);
}

function appendMetaItem(container, label, value, options = {}) {
  const { mono = false } = options;
  const row = document.createElement('div');
  row.className = 'result-meta-item';

  const title = document.createElement('dt');
  title.textContent = label;

  const content = document.createElement('dd');
  if (mono) {
    content.classList.add('mono-value');
  }
  content.textContent = normalizeText(value);

  row.append(title, content);
  container.appendChild(row);
}

function renderHealthPlaceholder() {
  healthOutput.textContent = '';
  const placeholder = document.createElement('p');
  placeholder.className = 'result-placeholder';
  placeholder.textContent = 'Listo para consultar GET /health.';
  healthOutput.appendChild(placeholder);
}

function renderHealthSuccess(response) {
  healthOutput.textContent = '';

  const header = document.createElement('header');
  header.className = 'result-header';

  const titleBlock = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = 'Backend operativo';
  const subtitle = document.createElement('p');
  subtitle.className = 'result-subtitle';
  subtitle.textContent = normalizeText(response.message, 'Servicio disponible');
  titleBlock.append(title, subtitle);

  const statusPill = document.createElement('span');
  statusPill.className = 'status-pill is-success';
  statusPill.textContent = `HTTP ${normalizeText(response.status, '200')}`;

  header.append(titleBlock, statusPill);
  healthOutput.appendChild(header);

  const meta = document.createElement('dl');
  meta.className = 'result-meta';
  appendMetaItem(meta, 'URL consultada', response.url, { mono: true });

  if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    for (const [key, value] of Object.entries(response.data)) {
      appendMetaItem(meta, key, value);
    }
  }

  healthOutput.appendChild(meta);
}

function renderHealthError(error) {
  healthOutput.textContent = '';

  const header = document.createElement('header');
  header.className = 'result-header';

  const titleBlock = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = 'Error de conectividad';
  const subtitle = document.createElement('p');
  subtitle.className = 'result-subtitle';
  subtitle.textContent = normalizeText(error.message, 'No se pudo consultar el estado del backend.');
  titleBlock.append(title, subtitle);

  const statusPill = document.createElement('span');
  statusPill.className = 'status-pill is-error';
  statusPill.textContent = `HTTP ${normalizeText(error.status, '500')}`;

  header.append(titleBlock, statusPill);
  healthOutput.appendChild(header);

  const meta = document.createElement('dl');
  meta.className = 'result-meta';
  appendMetaItem(meta, 'URL consultada', error.url, { mono: true });
  appendMetaItem(meta, 'Detalle', formatDetails(error.details));
  healthOutput.appendChild(meta);
}

async function checkHealth() {
  clearMessage(messageBox);
  healthOutput.textContent = '';

  const loading = document.createElement('p');
  loading.className = 'result-placeholder';
  loading.textContent = 'Consultando estado del backend...';
  healthOutput.appendChild(loading);

  try {
    const response = await apiRequest('/health');
    renderHealthSuccess(response);
    showMessage(messageBox, { type: 'success', message: 'Backend disponible.' });
  } catch (error) {
    renderHealthError(error);
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No fue posible consultar el health check.',
      details: error.details || ''
    });
  }
}

if (healthButton) {
  healthButton.addEventListener('click', checkHealth);
}

renderHealthPlaceholder();
