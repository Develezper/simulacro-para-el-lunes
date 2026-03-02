import { apiRequest } from '../shared/apiClient.js';
import { initializeShell } from '../shared/appShell.js';
import { clearMessage, setButtonLoading, showMessage } from '../shared/ui.js';

initializeShell('migration');

const form = document.getElementById('migrationForm');
const fileInput = document.getElementById('migrationFile');
const submitButton = document.getElementById('btnMigrationUpload');
const messageBox = document.getElementById('pageMessage');
const resultOutput = document.getElementById('migrationOutput');

function isValidFile(file) {
  return file && /\.(xlsx|csv|txt|tsv)$/i.test(file.name);
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

    resultOutput.textContent = JSON.stringify(response, null, 2);
    showMessage(messageBox, {
      type: 'success',
      message: response.message || 'Migracion ejecutada correctamente.'
    });
  } catch (error) {
    resultOutput.textContent = JSON.stringify(error, null, 2);
    showMessage(messageBox, {
      type: 'error',
      message: error.message || 'No se pudo ejecutar la migracion.',
      details: error.details || ''
    });
  } finally {
    setButtonLoading(submitButton, false);
  }
});
