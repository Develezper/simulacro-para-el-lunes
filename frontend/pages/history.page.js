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

function renderHistoryMetadata(documentData) {
  const rows = [
    ['Email cliente', documentData.clientEmail || ''],
    ['Nombre cliente', documentData.clientName || ''],
    ['Actualizado', formatDateTime(documentData.updatedAt)],
    ['Creado', formatDateTime(documentData.createdAt)],
    ['Transacciones', Array.isArray(documentData.transactions) ? documentData.transactions.length : 0]
  ];

  metaOutput.textContent = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(messageBox);
  metaOutput.textContent = '';

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
      emptyMessage: 'El cliente no tiene transacciones registradas en el historial.'
    });
  } catch (error) {
    renderTable(tableContainer, { columns: txColumns, rows: [] });
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No se pudo consultar el historial del cliente.',
      details: error.details || ''
    });
  }
});
