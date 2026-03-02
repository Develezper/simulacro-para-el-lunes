import { apiRequest } from '../shared/apiClient.js';
import { initializeShell } from '../shared/appShell.js';
import { clearMessage, formatCurrency, formatDateTime, renderTable, showMessage } from '../shared/ui.js';

initializeShell('reports');

const messageBox = document.getElementById('pageMessage');

const totalPaidContainer = document.getElementById('totalPaidTable');
const pendingInvoicesContainer = document.getElementById('pendingInvoicesTable');
const byPlatformContainer = document.getElementById('transactionsByPlatformTable');

const platformInput = document.getElementById('platformInput');

const columnsTotalPaid = [
  { key: 'id', label: 'ID' },
  { key: 'identification', label: 'Identificacion' },
  { key: 'full_name', label: 'Cliente' },
  { key: 'email', label: 'Email' },
  { key: 'invoices_count', label: 'Facturas' },
  { key: 'total_paid', label: 'Total pagado', formatter: (value) => formatCurrency(value) }
];

const columnsPendingInvoices = [
  { key: 'invoice_number', label: 'Factura' },
  { key: 'billing_period', label: 'Periodo' },
  { key: 'client_name', label: 'Cliente' },
  { key: 'client_email', label: 'Email' },
  { key: 'billed_amount', label: 'Facturado', formatter: (value) => formatCurrency(value) },
  { key: 'paid_amount', label: 'Pagado', formatter: (value) => formatCurrency(value) },
  { key: 'pending_amount', label: 'Pendiente', formatter: (value) => formatCurrency(value) },
  { key: 'status', label: 'Estado' }
];

const columnsTransactionsByPlatform = [
  { key: 'txn_code', label: 'Txn code' },
  { key: 'txn_date', label: 'Fecha', formatter: (value) => formatDateTime(value) },
  { key: 'amount', label: 'Monto', formatter: (value) => formatCurrency(value) },
  { key: 'status', label: 'Estado' },
  { key: 'transaction_type', label: 'Tipo' },
  { key: 'platform', label: 'Plataforma' },
  { key: 'client_name', label: 'Cliente' },
  { key: 'invoice_number', label: 'Factura' }
];

async function loadTotalPaid() {
  clearMessage(messageBox);

  try {
    const response = await apiRequest('/reports/total-paid-by-client');
    renderTable(totalPaidContainer, {
      columns: columnsTotalPaid,
      rows: Array.isArray(response.data) ? response.data : [],
      emptyMessage: 'No hay datos de total pagado.'
    });
  } catch (error) {
    renderTable(totalPaidContainer, { columns: columnsTotalPaid, rows: [] });
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No se pudo cargar el reporte de total pagado.',
      details: error.details || ''
    });
  }
}

async function loadPendingInvoices() {
  clearMessage(messageBox);

  try {
    const response = await apiRequest('/reports/pending-invoices');
    renderTable(pendingInvoicesContainer, {
      columns: columnsPendingInvoices,
      rows: Array.isArray(response.data) ? response.data : [],
      emptyMessage: 'No hay facturas pendientes.'
    });
  } catch (error) {
    renderTable(pendingInvoicesContainer, { columns: columnsPendingInvoices, rows: [] });
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No se pudo cargar el reporte de facturas pendientes.',
      details: error.details || ''
    });
  }
}

async function loadTransactionsByPlatform() {
  clearMessage(messageBox);

  const platform = String(platformInput.value || '').trim();
  if (!platform) {
    showMessage(messageBox, {
      type: 'error',
      message: 'Debes escribir una plataforma para consultar.'
    });
    return;
  }

  try {
    const response = await apiRequest(`/reports/transactions-by-platform?platform=${encodeURIComponent(platform)}`);
    renderTable(byPlatformContainer, {
      columns: columnsTransactionsByPlatform,
      rows: Array.isArray(response.data) ? response.data : [],
      emptyMessage: `No hay transacciones para la plataforma ${platform}.`
    });
  } catch (error) {
    renderTable(byPlatformContainer, { columns: columnsTransactionsByPlatform, rows: [] });
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No se pudo cargar el reporte por plataforma.',
      details: error.details || ''
    });
  }
}

document.getElementById('btnLoadTotalPaid').addEventListener('click', loadTotalPaid);
document.getElementById('btnLoadPendingInvoices').addEventListener('click', loadPendingInvoices);
document.getElementById('btnLoadByPlatform').addEventListener('click', loadTransactionsByPlatform);
