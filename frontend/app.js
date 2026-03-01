const output = document.getElementById('output');

function getBaseUrl() {
  return document.getElementById('baseUrl').value.trim().replace(/\/$/, '');
}

function showResult(title, payload) {
  output.textContent = `${title}\n\n${JSON.stringify(payload, null, 2)}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${getBaseUrl()}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw data;
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
  const fileInput = document.getElementById('migrationFile');
  if (!fileInput.files.length) return;

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    const result = await apiRequest('/migration/upload', {
      method: 'POST',
      body: formData
    });
    showResult('POST /migration/upload', result);
  } catch (error) {
    showResult('POST /migration/upload ERROR', error);
  }
});
