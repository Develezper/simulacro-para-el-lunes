import { executeQuery } from '../../config/mysql.js';

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

async function deleteClientById(id) {
  const sql = 'DELETE FROM clients WHERE id = ?';
  const result = await executeQuery(sql, [id]);
  return result.affectedRows > 0;
}

export {
  createClient,
  deleteClientById,
  findAllClients,
  findClientById,
  findClientByIdentificationOrEmail,
  updateClientById
};
