import { findClientHistoryByEmail } from './histories.repository.js';
import { findClientByEmail } from '../clients/clients.repository.js';
import { createHttpError } from '../../utils/httpError.js';

function validateHistoryEmail(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    throw createHttpError(400, 'Debes enviar un email valido en la ruta');
  }

  return email;
}

async function getClientHistoryByEmailService(rawEmail) {
  const email = validateHistoryEmail(rawEmail);
  const document = await findClientHistoryByEmail(email);

  if (document) {
    return document;
  }

  const client = await findClientByEmail(email);

  if (!client) {
    throw createHttpError(404, 'Cliente no encontrado');
  }

  return {
    clientEmail: client.email,
    clientName: client.full_name,
    createdAt: client.created_at ?? null,
    updatedAt: client.updated_at ?? null,
    transactions: []
  };
}

export { getClientHistoryByEmailService };
