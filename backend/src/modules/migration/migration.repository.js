import { executeQuery } from '../../config/mysql.js';

function deriveInvoiceStatus(billedAmount, paidAmount) {
  if (paidAmount <= 0) {
    return 'Pendiente';
  }

  if (paidAmount < billedAmount) {
    return 'Parcial';
  }

  return 'Pagada';
}

async function upsertClientRecord(client) {
  const result = await executeQuery(
    `
      INSERT INTO clients (identification, full_name, email, phone, address)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        email = VALUES(email),
        phone = VALUES(phone),
        address = VALUES(address),
        id = LAST_INSERT_ID(id)
    `,
    [client.identification, client.fullName, client.email, client.phone, client.address]
  );

  return result.insertId;
}

async function upsertPlatformRecord(platformName) {
  const result = await executeQuery(
    `
      INSERT INTO platforms (name)
      VALUES (?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        id = LAST_INSERT_ID(id)
    `,
    [platformName]
  );

  return result.insertId;
}

async function upsertInvoiceRecord(invoice) {
  const status = deriveInvoiceStatus(invoice.billedAmount, invoice.paidAmount);

  const result = await executeQuery(
    `
      INSERT INTO invoices (invoice_number, billing_period, billed_amount, paid_amount, status, client_id)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        billing_period = VALUES(billing_period),
        billed_amount = VALUES(billed_amount),
        paid_amount = VALUES(paid_amount),
        status = VALUES(status),
        client_id = VALUES(client_id),
        id = LAST_INSERT_ID(id)
    `,
    [
      invoice.invoiceNumber,
      invoice.billingPeriod,
      invoice.billedAmount,
      invoice.paidAmount,
      status,
      invoice.clientId
    ]
  );

  return result.insertId;
}

async function upsertTransactionRecord(transaction) {
  const result = await executeQuery(
    `
      INSERT INTO transactions (txn_code, txn_date, amount, status, transaction_type, client_id, platform_id, invoice_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        txn_date = VALUES(txn_date),
        amount = VALUES(amount),
        status = VALUES(status),
        transaction_type = VALUES(transaction_type),
        client_id = VALUES(client_id),
        platform_id = VALUES(platform_id),
        invoice_id = VALUES(invoice_id),
        id = LAST_INSERT_ID(id)
    `,
    [
      transaction.txnCode,
      transaction.txnDate,
      transaction.amount,
      transaction.status,
      transaction.transactionType,
      transaction.clientId,
      transaction.platformId,
      transaction.invoiceId
    ]
  );

  return result.insertId;
}

export {
  upsertClientRecord,
  upsertInvoiceRecord,
  upsertPlatformRecord,
  upsertTransactionRecord
};
