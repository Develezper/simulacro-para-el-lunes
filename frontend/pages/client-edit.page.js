import { apiRequest } from '../shared/apiClient.js';
import { initializeShell } from '../shared/appShell.js';
import { validateClientPayload } from '../shared/validators.js';
import { clearMessage, setButtonLoading, showMessage } from '../shared/ui.js';

initializeShell('clients');

const form = document.getElementById('editClientForm');
const messageBox = document.getElementById('pageMessage');
const submitButton = document.getElementById('btnUpdateClient');
const title = document.getElementById('editClientTitle');

const params = new URLSearchParams(window.location.search);
const rawId = params.get('id');
const clientId = Number(rawId);
let currentClient = null;

function getPayloadDiff(formData) {
  const candidate = Object.fromEntries(formData.entries());
  const diff = {};

  for (const [key, value] of Object.entries(candidate)) {
    const trimmed = String(value || '').trim();
    if (!trimmed) continue;

    if (trimmed !== String(currentClient?.[key] || '')) {
      diff[key] = trimmed;
    }
  }

  return diff;
}

async function loadClient() {
  if (!Number.isInteger(clientId) || clientId <= 0) {
    showMessage(messageBox, {
      type: 'error',
      message: 'ID de cliente invalido en la URL.'
    });
    submitButton.disabled = true;
    form.querySelectorAll('input').forEach((input) => {
      input.disabled = true;
    });
    return;
  }

  clearMessage(messageBox);

  try {
    const response = await apiRequest(`/clients/${clientId}`);
    currentClient = response.data;

    title.textContent = `Editar cliente #${clientId}`;

    for (const input of form.querySelectorAll('input[name]')) {
      const fieldName = input.name;
      input.value = String(currentClient[fieldName] || '');
    }
  } catch (error) {
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No se pudo cargar el cliente.',
      details: error.details || ''
    });
    submitButton.disabled = true;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentClient) {
    showMessage(messageBox, {
      type: 'error',
      message: 'No hay datos del cliente para actualizar.'
    });
    return;
  }

  clearMessage(messageBox);

  const formData = new FormData(form);
  const diff = getPayloadDiff(formData);
  const validation = validateClientPayload(diff, { partial: true });

  if (!validation.isValid) {
    showMessage(messageBox, {
      type: 'error',
      message: 'No hay cambios validos para guardar.',
      details: validation.errors.join('\n')
    });
    return;
  }

  try {
    setButtonLoading(submitButton, true, 'Guardando...');

    await apiRequest(`/clients/${clientId}`, {
      method: 'PUT',
      data: validation.data
    });

    showMessage(messageBox, {
      type: 'success',
      message: 'Cliente actualizado correctamente. Redirigiendo...'
    });

    window.setTimeout(() => {
      window.location.href = '/clients.html?updated=1';
    }, 700);
  } catch (error) {
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No se pudo actualizar el cliente.',
      details: error.details || ''
    });
  } finally {
    setButtonLoading(submitButton, false);
  }
});

loadClient();
