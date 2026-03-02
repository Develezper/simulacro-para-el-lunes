import { apiRequest } from '../shared/apiClient.js';
import { initializeShell } from '../shared/appShell.js';
import { validateEmail } from '../shared/validators.js';
import { clearMessage, formatCurrency, formatDateTime, renderTable, showMessage } from '../shared/ui.js';

initializeShell('history');

const form = document.getElementById('historyForm');
const emailInput = document.getElementById('historyEmail');
const messageBox = document.getElementById('pageMessage');
const metaOutput = document.getElementById('historyMeta');
const tableContainer = document.getElementById('historyTransactionsTable');

const txColumns = [
  { key: 'txnCode', label: 'Txn code' },
  { key: 'date', label: 'Fecha', formatter: (value) => formatDateTime(value) },
  { key: 'platform', label: 'Plataforma' },
  { key: 'invoiceNumber', label: 'Factura' },
  { key: 'transactionType', label: 'Tipo' },
  { key: 'status', label: 'Estado' },
  { key: 'amount', label: 'Monto', formatter: (value) => formatCurrency(value) }
];

function normalizeText(value, fallback = 'No disponible') {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function setHistoryPlaceholder() {
  metaOutput.textContent = '';
  const placeholder = document.createElement('p');
  placeholder.className = 'result-placeholder';
  placeholder.textContent = 'Aun no se ha consultado ningun cliente.';
  metaOutput.appendChild(placeholder);
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

function renderHistoryMetadata(documentData) {
  metaOutput.textContent = '';

  const meta = document.createElement('dl');
  meta.className = 'result-meta';

  appendMetaItem(meta, 'Email cliente', documentData.clientEmail, { mono: true });
  appendMetaItem(meta, 'Nombre cliente', documentData.clientName);
  appendMetaItem(meta, 'Actualizado', formatDateTime(documentData.updatedAt));
  appendMetaItem(meta, 'Creado', formatDateTime(documentData.createdAt));
  appendMetaItem(meta, 'Transacciones', Array.isArray(documentData.transactions) ? documentData.transactions.length : 0, {
    mono: true
  });

  metaOutput.appendChild(meta);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(messageBox);
  setHistoryPlaceholder();

  const email = String(emailInput.value || '').trim().toLowerCase();
  if (!validateEmail(email)) {
    showMessage(messageBox, {
      type: 'error',
      message: 'Debes escribir un email valido.'
    });
    return;
  }

  try {
    const response = await apiRequest(`/clients/${encodeURIComponent(email)}/history`);
    const documentData = response.data || {};
    renderHistoryMetadata(documentData);

    renderTable(tableContainer, {
      columns: txColumns,
      rows: Array.isArray(documentData.transactions) ? documentData.transactions : [],
      emptyMessage: 'El cliente no tiene transacciones registradas en el historial.',
      pagination: {
        enabled: true,
        pageSize: 10,
        pageSizeOptions: [10, 25, 50]
      }
    });
  } catch (error) {
    renderTable(tableContainer, {
      columns: txColumns,
      rows: [],
      pagination: {
        enabled: true,
        pageSize: 10,
        pageSizeOptions: [10, 25, 50]
      }
    });
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No se pudo consultar el historial del cliente.',
      details: error.details || ''
    });
  }
});

setHistoryPlaceholder();
