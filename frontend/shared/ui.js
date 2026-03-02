function setActiveNavigation(pageId) {
  const links = document.querySelectorAll('[data-nav]');

  links.forEach((link) => {
    const active = link.dataset.nav === pageId;
    link.classList.toggle('is-active', active);
    if (active) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function showMessage(container, { type = 'info', message = '', details = '' } = {}) {
  if (!container) return;

  container.hidden = false;
  container.className = `alert alert--${type}`;
  container.textContent = details ? `${message}\n${details}` : message;
}

function clearMessage(container) {
  if (!container) return;

  container.hidden = true;
  container.className = 'alert';
  container.textContent = '';
}

function setButtonLoading(button, isLoading, loadingText = 'Procesando...') {
  if (!button) return;

  if (isLoading) {
    button.disabled = true;
    button.dataset.defaultLabel = button.textContent;
    button.textContent = loadingText;
    return;
  }

  button.disabled = false;
  if (button.dataset.defaultLabel) {
    button.textContent = button.dataset.defaultLabel;
  }
}

function createCell(content) {
  const td = document.createElement('td');

  if (content instanceof Node) {
    td.appendChild(content);
  } else {
    td.textContent = content == null ? '' : String(content);
  }

  return td;
}

function renderTable(container, { columns = [], rows = [], emptyMessage = 'Sin datos para mostrar.' } = {}) {
  if (!container) return;

  container.textContent = '';

  if (!rows.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = emptyMessage;
    container.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'data-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');

  for (const column of columns) {
    const th = document.createElement('th');
    th.textContent = column.label;
    headRow.appendChild(th);
  }

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (const row of rows) {
    const tr = document.createElement('tr');

    for (const column of columns) {
      const rawValue = typeof column.formatter === 'function' ? column.formatter(row[column.key], row) : row[column.key];
      tr.appendChild(createCell(rawValue));
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';
  wrapper.appendChild(table);
  container.appendChild(wrapper);
}

function formatCurrency(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return value == null ? '' : String(value);
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 2
  }).format(number);
}

function formatDateTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export {
  clearMessage,
  formatCurrency,
  formatDateTime,
  renderTable,
  setActiveNavigation,
  setButtonLoading,
  showMessage
};
