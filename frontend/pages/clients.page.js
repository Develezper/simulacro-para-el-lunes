import { apiRequest } from '../shared/apiClient.js';
import { initializeShell } from '../shared/appShell.js';
import { clearMessage, showMessage } from '../shared/ui.js';

initializeShell('clients');

const messageBox = document.getElementById('pageMessage');
const searchInput = document.getElementById('searchClient');
const refreshButton = document.getElementById('btnRefreshClients');
const tbody = document.getElementById('clientsTableBody');
const detailOutput = document.getElementById('clientDetailOutput');
const paginationMeta = document.getElementById('clientsPaginationMeta');
const pageIndicator = document.getElementById('pageIndicator');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const prevPageButton = document.getElementById('btnPrevPage');
const nextPageButton = document.getElementById('btnNextPage');

let allClients = [];
let currentPage = 1;
let pageSize = 10;

function getQueryMessage() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('created') === '1') {
    return 'Cliente creado correctamente.';
  }

  if (params.get('updated') === '1') {
    return 'Cliente actualizado correctamente.';
  }

  return '';
}

function normalizeSearch(value) {
  return String(value || '').trim().toLowerCase();
}

function filterClients(clients, query) {
  if (!query) return clients;

  return clients.filter((client) => {
    const fields = [client.id, client.identification, client.full_name, client.email]
      .map((item) => String(item || '').toLowerCase());

    return fields.some((value) => value.includes(query));
  });
}

function createActionButton(label, className, callback) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', callback);
  return button;
}

function getFilteredClients() {
  const query = normalizeSearch(searchInput.value);
  return filterClients(allClients, query);
}

function getPagination(filteredRows) {
  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const startIndex = totalRows ? (currentPage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, totalRows);

  return {
    totalRows,
    totalPages,
    startIndex,
    endIndex,
    rows: filteredRows.slice(startIndex, endIndex)
  };
}

function renderPagination({ totalRows, totalPages, startIndex, endIndex }) {
  if (paginationMeta) {
    paginationMeta.textContent = totalRows
      ? `Mostrando ${startIndex + 1}-${endIndex} de ${totalRows} resultados.`
      : 'Sin resultados.';
  }

  if (pageIndicator) {
    pageIndicator.textContent = totalRows ? `Pagina ${currentPage} de ${totalPages}` : 'Pagina 0 de 0';
  }

  if (prevPageButton) {
    prevPageButton.disabled = totalRows === 0 || currentPage <= 1;
  }

  if (nextPageButton) {
    nextPageButton.disabled = totalRows === 0 || currentPage >= totalPages;
  }
}

function renderRows() {
  const filteredRows = getFilteredClients();
  const pagination = getPagination(filteredRows);
  const rows = pagination.rows;

  tbody.textContent = '';

  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = 'empty-cell';
    td.textContent = 'No hay clientes para mostrar con ese filtro.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    renderPagination(pagination);
    return;
  }

  for (const client of rows) {
    const tr = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = String(client.id);
    tr.appendChild(idCell);

    const identificationCell = document.createElement('td');
    identificationCell.textContent = client.identification;
    tr.appendChild(identificationCell);

    const fullNameCell = document.createElement('td');
    fullNameCell.textContent = client.full_name;
    tr.appendChild(fullNameCell);

    const emailCell = document.createElement('td');
    emailCell.textContent = client.email;
    tr.appendChild(emailCell);

    const phoneCell = document.createElement('td');
    phoneCell.textContent = client.phone;
    tr.appendChild(phoneCell);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'actions-cell';

    const viewButton = createActionButton('Ver', 'btn btn--ghost', () => {
      detailOutput.textContent = JSON.stringify(client, null, 2);
    });

    const editLink = document.createElement('a');
    editLink.className = 'btn btn--secondary';
    editLink.textContent = 'Editar';
    editLink.href = `/client-edit.html?id=${client.id}`;

    const deleteButton = createActionButton('Eliminar', 'btn btn--danger', async () => {
      const accepted = window.confirm(`Eliminar cliente #${client.id} (${client.full_name})?`);
      if (!accepted) return;

      clearMessage(messageBox);

      try {
        const response = await apiRequest(`/clients/${client.id}`, { method: 'DELETE' });
        showMessage(messageBox, {
          type: 'success',
          message: response.message || 'Cliente eliminado correctamente.'
        });
        await loadClients();
      } catch (error) {
        showMessage(messageBox, {
          type: 'error',
          message: error.message || 'No se pudo eliminar el cliente.',
          details: error.details || ''
        });
      }
    });

    actionsCell.append(viewButton, editLink, deleteButton);
    tr.appendChild(actionsCell);

    tbody.appendChild(tr);
  }

  renderPagination(pagination);
}

async function loadClients() {
  clearMessage(messageBox);

  try {
    const response = await apiRequest('/clients');
    allClients = Array.isArray(response.data) ? response.data : [];
    renderRows();
  } catch (error) {
    allClients = [];
    renderRows();
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No fue posible cargar los clientes.',
      details: error.details || ''
    });
  }
}

searchInput.addEventListener('input', () => {
  currentPage = 1;
  renderRows();
});

refreshButton.addEventListener('click', loadClients);

if (pageSizeSelect) {
  pageSizeSelect.value = String(pageSize);

  pageSizeSelect.addEventListener('change', () => {
    const selectedSize = Number(pageSizeSelect.value);
    pageSize = Number.isInteger(selectedSize) && selectedSize > 0 ? selectedSize : 10;
    currentPage = 1;
    renderRows();
  });
}

if (prevPageButton) {
  prevPageButton.addEventListener('click', () => {
    if (currentPage <= 1) return;
    currentPage -= 1;
    renderRows();
  });
}

if (nextPageButton) {
  nextPageButton.addEventListener('click', () => {
    const totalRows = getFilteredClients().length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

    if (currentPage >= totalPages) return;
    currentPage += 1;
    renderRows();
  });
}

const flashMessage = getQueryMessage();

loadClients().then(() => {
  if (flashMessage) {
    showMessage(messageBox, { type: 'success', message: flashMessage });
  }
});
