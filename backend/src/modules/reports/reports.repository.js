import { executeQuery } from '../../config/mysql.js';

async function getTotalPaidByClientRows() {
  const sql = `
    SELECT
      c.id,
      c.identification,
      c.full_name,
      c.email,
      COALESCE(SUM(i.paid_amount), 0) AS total_paid,
      COALESCE(COUNT(i.id), 0) AS invoices_count
    FROM clients c
    LEFT JOIN invoices i ON i.client_id = c.id
    GROUP BY c.id, c.identification, c.full_name, c.email
    ORDER BY total_paid DESC, c.id ASC
  `;

  return executeQuery(sql);
}

async function getPendingInvoicesRows() {
  const sql = `
    SELECT
      i.id,
      i.invoice_number,
      i.billing_period,
      i.billed_amount,
      i.paid_amount,
      i.status,
      (i.billed_amount - i.paid_amount) AS pending_amount,
      c.id AS client_id,
      c.full_name AS client_name,
      c.email AS client_email
    FROM invoices i
    INNER JOIN clients c ON c.id = i.client_id
    WHERE i.paid_amount < i.billed_amount
       OR i.status IN ('Pendiente', 'Parcial')
    ORDER BY i.billing_period DESC, i.id DESC
  `;

  return executeQuery(sql);
}

async function getTransactionsByPlatformRows(platformName) {
  const sql = `
    SELECT
      t.id,
      t.txn_code,
      t.txn_date,
      t.amount,
      t.status,
      t.transaction_type,
      p.name AS platform,
      c.id AS client_id,
      c.full_name AS client_name,
      c.email AS client_email,
      i.invoice_number
    FROM transactions t
    INNER JOIN platforms p ON p.id = t.platform_id
    INNER JOIN clients c ON c.id = t.client_id
    INNER JOIN invoices i ON i.id = t.invoice_id
    WHERE p.name = ?
    ORDER BY t.txn_date DESC, t.id DESC
  `;

  return executeQuery(sql, [platformName]);
}

export {
  getPendingInvoicesRows,
  getTotalPaidByClientRows,
  getTransactionsByPlatformRows
};
