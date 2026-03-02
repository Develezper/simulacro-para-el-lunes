import { apiRequest } from '../shared/apiClient.js';
import { initializeShell } from '../shared/appShell.js';
import { clearMessage, showMessage } from '../shared/ui.js';

initializeShell('clients');

const messageBox = document.getElementById('pageMessage');
const searchInput = document.getElementById('searchClient');
const refreshButton = document.getElementById('btnRefreshClients');
const tbody = document.getElementById('clientsTableBody');
const detailOutput = document.getElementById('clientDetailOutput');

let allClients = [];

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

function renderRows() {
  const query = normalizeSearch(searchInput.value);
  const rows = filterClients(allClients, query);

  tbody.textContent = '';

  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = 'empty-cell';
    td.textContent = 'No hay clientes para mostrar con ese filtro.';
    tr.appendChild(td);
    tbody.appendChild(tr);
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

searchInput.addEventListener('input', renderRows);
refreshButton.addEventListener('click', loadClients);

const flashMessage = getQueryMessage();

loadClients().then(() => {
  if (flashMessage) {
    showMessage(messageBox, { type: 'success', message: flashMessage });
  }
});
