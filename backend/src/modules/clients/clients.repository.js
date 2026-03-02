import { executeQuery, getMySQLPool } from '../../config/mysql.js';

const CLIENT_COLUMNS = 'id, identification, full_name, email, phone, address';

async function findAllClients() {
  const sql = `SELECT ${CLIENT_COLUMNS} FROM clients ORDER BY id DESC`;
  return executeQuery(sql);
}

async function findClientById(id) {
  const sql = `SELECT ${CLIENT_COLUMNS} FROM clients WHERE id = ? LIMIT 1`;
  const rows = await executeQuery(sql, [id]);
  return rows[0] ?? null;
}

async function findClientByEmail(email) {
  const sql = `
    SELECT id, identification, full_name, email, phone, address, created_at, updated_at
    FROM clients
    WHERE email = ?
    LIMIT 1
  `;
  const rows = await executeQuery(sql, [email]);
  return rows[0] ?? null;
}

async function findClientByIdentificationOrEmail(identification, email, excludedId = null) {
  let sql = `SELECT ${CLIENT_COLUMNS} FROM clients WHERE (identification = ? OR email = ?)`;
  const params = [identification, email];

  if (excludedId !== null) {
    sql += ' AND id <> ?';
    params.push(excludedId);
  }

  sql += ' LIMIT 1';

  const rows = await executeQuery(sql, params);
  return rows[0] ?? null;
}

async function createClient(clientData) {
  const sql = `
    INSERT INTO clients (identification, full_name, email, phone, address)
    VALUES (?, ?, ?, ?, ?)
  `;

  const result = await executeQuery(sql, [
    clientData.identification,
    clientData.full_name,
    clientData.email,
    clientData.phone,
    clientData.address
  ]);

  return findClientById(result.insertId);
}

async function updateClientById(id, clientData) {
  const entries = Object.entries(clientData);
  const setClause = entries.map(([field]) => `${field} = ?`).join(', ');
  const params = entries.map(([, value]) => value);
  params.push(id);

  const sql = `UPDATE clients SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  await executeQuery(sql, params);

  return findClientById(id);
}

async function deleteClientCascadeById(id) {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [transactionsResult] = await connection.execute(
      'DELETE FROM transactions WHERE client_id = ?',
      [id]
    );
    const [invoicesResult] = await connection.execute('DELETE FROM invoices WHERE client_id = ?', [id]);
    const [clientResult] = await connection.execute('DELETE FROM clients WHERE id = ?', [id]);

    await connection.commit();

    return {
      deletedTransactions: transactionsResult.affectedRows ?? 0,
      deletedInvoices: invoicesResult.affectedRows ?? 0,
      deletedClients: clientResult.affectedRows ?? 0
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export {
  createClient,
  deleteClientCascadeById,
  findAllClients,
  findClientByEmail,
  findClientById,
  findClientByIdentificationOrEmail,
  updateClientById
};
