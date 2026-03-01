const output = document.getElementById('output');
const DEFAULT_API_BASE = 'http://127.0.0.1:3000/api';
const DEFAULT_TIMEOUT_MS = 20000;

function normalizeBaseUrl(rawValue) {
  let value = String(rawValue || '').trim();

  if (!value) return DEFAULT_API_BASE;

  value = value.replace(/\/+$/, '');

  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }

  if (!/\/api$/i.test(value)) {
    value = `${value}/api`;
  }

  return value;
}

function getBaseUrl() {
  const input = document.getElementById('baseUrl');
  const normalized = normalizeBaseUrl(input.value);
  input.value = normalized;
  return normalized;
}

function showResult(title, payload) {
  output.textContent = `${title}\n\n${JSON.stringify(payload, null, 2)}`;
}

async function apiRequest(path, options = {}) {
  let response;
  const requestUrl = `${getBaseUrl()}${path}`;
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    response = await fetch(requestUrl, { ...fetchOptions, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw {
        message: `La solicitud supero el tiempo limite (${Math.round(timeoutMs / 1000)}s).`,
        details: `Request timeout para ${requestUrl}`
      };
    }

    throw {
      message: 'No se pudo conectar al backend. Verifica que este ejecutandose en http://127.0.0.1:3000.',
      details: error?.message || 'Error de red'
    };
  } finally {
    clearTimeout(timeout);
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    let message = data?.message || `Error HTTP ${response.status}`;

    if (!message && !isJson) {
      const text = await response.text().catch(() => '');
      if (text) message = text;
    }

    throw {
      ...data,
      ok: false,
      status: response.status,
      url: requestUrl,
      message
    };
  }

  return data;
}

document.getElementById('btnHealth').addEventListener('click', async () => {
  try {
    showResult('GET /health', await apiRequest('/health'));
  } catch (error) {
    showResult('GET /health ERROR', error);
  }
});

document.getElementById('btnClients').addEventListener('click', async () => {
  try {
    showResult('GET /clients', await apiRequest('/clients'));
  } catch (error) {
    showResult('GET /clients ERROR', error);
  }
});

document.getElementById('btnClientById').addEventListener('click', async () => {
  const id = document.getElementById('clientId').value.trim();
  if (!id) return;

  try {
    showResult(`GET /clients/${id}`, await apiRequest(`/clients/${id}`));
  } catch (error) {
    showResult(`GET /clients/${id} ERROR`, error);
  }
});

document.getElementById('createClientForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const body = Object.fromEntries(formData.entries());

  try {
    const result = await apiRequest('/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    showResult('POST /clients', result);
  } catch (error) {
    showResult('POST /clients ERROR', error);
  }
});

document.getElementById('btnTotalPaid').addEventListener('click', async () => {
  try {
    showResult('GET /reports/total-paid-by-client', await apiRequest('/reports/total-paid-by-client'));
  } catch (error) {
    showResult('GET /reports/total-paid-by-client ERROR', error);
  }
});

document.getElementById('btnPending').addEventListener('click', async () => {
  try {
    showResult('GET /reports/pending-invoices', await apiRequest('/reports/pending-invoices'));
  } catch (error) {
    showResult('GET /reports/pending-invoices ERROR', error);
  }
});

document.getElementById('btnByPlatform').addEventListener('click', async () => {
  const platform = document.getElementById('platformName').value.trim() || 'Nequi';

  try {
    showResult(
      `GET /reports/transactions-by-platform?platform=${platform}`,
      await apiRequest(`/reports/transactions-by-platform?platform=${encodeURIComponent(platform)}`)
    );
  } catch (error) {
    showResult('GET /reports/transactions-by-platform ERROR', error);
  }
});

document.getElementById('btnHistory').addEventListener('click', async () => {
  const email = document.getElementById('historyEmail').value.trim();
  if (!email) return;

  try {
    showResult(`GET /clients/${email}/history`, await apiRequest(`/clients/${encodeURIComponent(email)}/history`));
  } catch (error) {
    showResult('GET /clients/:email/history ERROR', error);
  }
});

document.getElementById('migrationForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  const fileInput = document.getElementById('migrationFile');
  if (!fileInput.files.length) return;
  if (submitButton.disabled) return;

  const file = fileInput.files[0];
  const isAllowed = /\.(xlsx|csv|txt|tsv)$/i.test(file.name);

  if (!isAllowed) {
    showResult('POST /migration/upload ERROR', {
      ok: false,
      message: 'Archivo invalido. Selecciona un .xlsx, .csv, .txt o .tsv',
      fileName: file.name
    });
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    submitButton.disabled = true;
    const originalLabel = submitButton.textContent;
    submitButton.dataset.originalLabel = originalLabel;
    submitButton.textContent = 'Subiendo...';

    const result = await apiRequest('/migration/upload', {
      method: 'POST',
      body: formData,
      timeoutMs: 180000
    });
    showResult('POST /migration/upload', result);
  } catch (error) {
    showResult('POST /migration/upload ERROR', error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.originalLabel || 'POST /migration/upload';
  }
});

document.getElementById('baseUrl').value = normalizeBaseUrl(document.getElementById('baseUrl').value);
