import { apiRequest } from '../shared/apiClient.js';
import { initializeShell } from '../shared/appShell.js';
import { validateClientPayload } from '../shared/validators.js';
import { clearMessage, setButtonLoading, showMessage } from '../shared/ui.js';

initializeShell('create-client');

const form = document.getElementById('createClientForm');
const messageBox = document.getElementById('pageMessage');
const submitButton = document.getElementById('btnCreateClient');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(messageBox);

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const validation = validateClientPayload(payload, { partial: false });

  if (!validation.isValid) {
    showMessage(messageBox, {
      type: 'error',
      message: 'Corrige los campos del formulario.',
      details: validation.errors.join('\n')
    });
    return;
  }

  try {
    setButtonLoading(submitButton, true, 'Creando...');
    await apiRequest('/clients', {
      method: 'POST',
      data: validation.data
    });

    showMessage(messageBox, { type: 'success', message: 'Cliente creado correctamente. Redirigiendo...' });
    window.setTimeout(() => {
      window.location.href = '/clients.html?created=1';
    }, 700);
  } catch (error) {
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No se pudo crear el cliente.',
      details: error.details || ''
    });
  } finally {
    setButtonLoading(submitButton, false);
  }
});
