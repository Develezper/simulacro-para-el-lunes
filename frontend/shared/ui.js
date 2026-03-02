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

function resolvePageSize(rawValue, fallbackValue) {
  const value = Number(rawValue);
  if (Number.isInteger(value) && value > 0) {
    return value;
  }

  return fallbackValue;
}

function renderTable(
  container,
  { columns = [], rows = [], emptyMessage = 'Sin datos para mostrar.', pagination = null } = {}
) {
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
  table.appendChild(tbody);
  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';
  wrapper.appendChild(table);
  container.appendChild(wrapper);

  const shouldPaginate = Boolean(pagination?.enabled);
  if (!shouldPaginate) {
    for (const row of rows) {
      const tr = document.createElement('tr');

      for (const column of columns) {
        const rawValue = typeof column.formatter === 'function' ? column.formatter(row[column.key], row) : row[column.key];
        tr.appendChild(createCell(rawValue));
      }

      tbody.appendChild(tr);
    }
    return;
  }

  const pageSizeOptions = Array.isArray(pagination?.pageSizeOptions) && pagination.pageSizeOptions.length
    ? pagination.pageSizeOptions
    : [10, 20, 50];

  let pageSize = resolvePageSize(pagination?.pageSize, resolvePageSize(pageSizeOptions[0], 10));
  let currentPage = 1;

  const paginationBar = document.createElement('div');
  paginationBar.className = 'pagination-bar';
  paginationBar.setAttribute('aria-live', 'polite');

  const meta = document.createElement('p');
  meta.className = 'pagination-meta';

  const controls = document.createElement('div');
  controls.className = 'pagination-controls';

  const sizeLabel = document.createElement('label');
  sizeLabel.textContent = 'Por pagina';

  const sizeSelect = document.createElement('select');
  sizeSelect.ariaLabel = 'Seleccionar cantidad de filas por pagina';

  for (const option of pageSizeOptions) {
    const safeOption = resolvePageSize(option, 0);
    if (!safeOption) continue;

    const item = document.createElement('option');
    item.value = String(safeOption);
    item.textContent = String(safeOption);
    sizeSelect.appendChild(item);
  }

  if (!sizeSelect.options.length) {
    const fallback = document.createElement('option');
    fallback.value = '10';
    fallback.textContent = '10';
    sizeSelect.appendChild(fallback);
  }

  if (![...sizeSelect.options].some((item) => Number(item.value) === pageSize)) {
    const dynamic = document.createElement('option');
    dynamic.value = String(pageSize);
    dynamic.textContent = String(pageSize);
    sizeSelect.appendChild(dynamic);
  }

  sizeSelect.value = String(pageSize);
  sizeLabel.htmlFor = `tablePageSize-${Math.random().toString(36).slice(2, 8)}`;
  sizeSelect.id = sizeLabel.htmlFor;

  const prevButton = document.createElement('button');
  prevButton.type = 'button';
  prevButton.className = 'btn btn--ghost';
  prevButton.textContent = 'Anterior';

  const indicator = document.createElement('span');
  indicator.className = 'pagination-indicator';

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'btn btn--ghost';
  nextButton.textContent = 'Siguiente';

  controls.append(sizeLabel, sizeSelect, prevButton, indicator, nextButton);
  paginationBar.append(meta, controls);
  container.appendChild(paginationBar);

  function renderPage() {
    tbody.textContent = '';

    const totalRows = rows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRows);
    const visibleRows = rows.slice(startIndex, endIndex);

    for (const row of visibleRows) {
      const tr = document.createElement('tr');

      for (const column of columns) {
        const rawValue = typeof column.formatter === 'function' ? column.formatter(row[column.key], row) : row[column.key];
        tr.appendChild(createCell(rawValue));
      }

      tbody.appendChild(tr);
    }

    meta.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${totalRows} resultados.`;
    indicator.textContent = `Pagina ${currentPage} de ${totalPages}`;
    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
  }

  sizeSelect.addEventListener('change', () => {
    pageSize = resolvePageSize(sizeSelect.value, pageSize);
    currentPage = 1;
    renderPage();
  });

  prevButton.addEventListener('click', () => {
    if (currentPage <= 1) return;
    currentPage -= 1;
    renderPage();
  });

  nextButton.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    if (currentPage >= totalPages) return;
    currentPage += 1;
    renderPage();
  });

  renderPage();
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
