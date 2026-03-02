const API_BASE_STORAGE_KEY = 'fintech_admin_api_base';
const DEFAULT_API_BASE = 'http://127.0.0.1:3000/api';

function normalizeApiBaseUrl(rawValue) {
  let value = String(rawValue || '').trim();

  if (!value) {
    return DEFAULT_API_BASE;
  }

  value = value.replace(/\/+$/, '');

  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }

  if (!/\/api$/i.test(value)) {
    value = `${value}/api`;
  }

  return value;
}

function getStoredApiBaseUrl() {
  try {
    const raw = window.localStorage.getItem(API_BASE_STORAGE_KEY);
    return raw ? normalizeApiBaseUrl(raw) : DEFAULT_API_BASE;
  } catch {
    return DEFAULT_API_BASE;
  }
}

function setStoredApiBaseUrl(rawValue) {
  const normalized = normalizeApiBaseUrl(rawValue);

  try {
    window.localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
  } catch {
    // Ignora errores de almacenamiento del navegador.
  }

  return normalized;
}

function resetStoredApiBaseUrl() {
  try {
    window.localStorage.removeItem(API_BASE_STORAGE_KEY);
  } catch {
    // Ignora errores de almacenamiento del navegador.
  }

  return DEFAULT_API_BASE;
}

function bindApiBaseControls({
  formId = 'apiConfigForm',
  inputId = 'apiBaseInput',
  resetId = 'apiResetBtn',
  feedbackId = 'apiConfigFeedback'
} = {}) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);
  const resetButton = document.getElementById(resetId);
  const feedback = document.getElementById(feedbackId);

  if (!input) {
    return;
  }

  input.value = getStoredApiBaseUrl();

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const normalized = setStoredApiBaseUrl(input.value);
      input.value = normalized;

      if (feedback) {
        feedback.textContent = `API guardada: ${normalized}`;
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      const normalized = resetStoredApiBaseUrl();
      input.value = normalized;

      if (feedback) {
        feedback.textContent = `API restablecida: ${normalized}`;
      }
    });
  }
}

export {
  API_BASE_STORAGE_KEY,
  DEFAULT_API_BASE,
  bindApiBaseControls,
  getStoredApiBaseUrl,
  normalizeApiBaseUrl,
  resetStoredApiBaseUrl,
  setStoredApiBaseUrl
};
