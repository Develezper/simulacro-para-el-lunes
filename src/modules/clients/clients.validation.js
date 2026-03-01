import { createHttpError } from '../../utils/httpError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_FIELDS = ['identification', 'full_name', 'email', 'phone', 'address'];

function normalizeString(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

function validateClientId(rawId) {
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError(400, 'El parametro id debe ser un entero positivo');
  }

  return id;
}

function validateClientPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createHttpError(400, 'El body debe ser un objeto JSON valido');
  }

  const parsed = {};

  for (const field of VALID_FIELDS) {
    if (payload[field] !== undefined) {
      parsed[field] = normalizeString(payload[field]);
    }
  }

  if (!partial) {
    for (const field of VALID_FIELDS) {
      if (parsed[field] === undefined || parsed[field] === '') {
        throw createHttpError(400, `El campo ${field} es obligatorio`);
      }
    }
  }

  if (partial && Object.keys(parsed).length === 0) {
    throw createHttpError(400, 'Debes enviar al menos un campo para actualizar');
  }

  if (parsed.identification !== undefined) {
    if (typeof parsed.identification !== 'string' || parsed.identification.length < 4 || parsed.identification.length > 32) {
      throw createHttpError(400, 'identification debe tener entre 4 y 32 caracteres');
    }
  }

  if (parsed.full_name !== undefined) {
    if (typeof parsed.full_name !== 'string' || parsed.full_name.length < 3 || parsed.full_name.length > 150) {
      throw createHttpError(400, 'full_name debe tener entre 3 y 150 caracteres');
    }
  }

  if (parsed.email !== undefined) {
    if (typeof parsed.email !== 'string' || parsed.email.length > 180 || !EMAIL_REGEX.test(parsed.email)) {
      throw createHttpError(400, 'email no tiene un formato valido');
    }
  }

  if (parsed.phone !== undefined) {
    if (typeof parsed.phone !== 'string' || parsed.phone.length < 7 || parsed.phone.length > 40) {
      throw createHttpError(400, 'phone debe tener entre 7 y 40 caracteres');
    }
  }

  if (parsed.address !== undefined) {
    if (typeof parsed.address !== 'string' || parsed.address.length < 5 || parsed.address.length > 255) {
      throw createHttpError(400, 'address debe tener entre 5 y 255 caracteres');
    }
  }

  return parsed;
}

export { validateClientId, validateClientPayload };
