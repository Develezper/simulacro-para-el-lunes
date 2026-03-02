import { apiRequest } from '../shared/apiClient.js';
import { initializeShell } from '../shared/appShell.js';
import { clearMessage, showMessage } from '../shared/ui.js';

initializeShell('dashboard');

const healthButton = document.getElementById('btnCheckHealth');
const healthOutput = document.getElementById('healthOutput');
const messageBox = document.getElementById('pageMessage');

async function checkHealth() {
  clearMessage(messageBox);
  healthOutput.textContent = 'Consultando estado del backend...';

  try {
    const response = await apiRequest('/health');
    healthOutput.textContent = JSON.stringify(response, null, 2);
    showMessage(messageBox, { type: 'success', message: 'Backend disponible.' });
  } catch (error) {
    healthOutput.textContent = JSON.stringify(error, null, 2);
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
