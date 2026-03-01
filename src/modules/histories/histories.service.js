import { findClientHistoryByEmail } from './histories.repository.js';
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

  if (!document) {
    throw createHttpError(404, 'Historial de cliente no encontrado');
  }

  return document;
}

export { getClientHistoryByEmailService };
