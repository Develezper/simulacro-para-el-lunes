const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLIENT_FIELDS = ['identification', 'full_name', 'email', 'phone', 'address'];

function trimString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function validateEmail(value) {
  const normalized = trimString(value || '').toLowerCase();
  return EMAIL_REGEX.test(normalized);
}

function normalizeClientPayload(payload) {
  const normalized = {};

  for (const field of CLIENT_FIELDS) {
    if (payload[field] !== undefined) {
      normalized[field] = trimString(payload[field]);
    }
  }

  return normalized;
}

function validateClientPayload(payload, { partial = false } = {}) {
  const normalized = normalizeClientPayload(payload || {});
  const errors = [];

  if (!partial) {
    for (const field of CLIENT_FIELDS) {
      if (normalized[field] === undefined || normalized[field] === '') {
        errors.push(`El campo ${field} es obligatorio.`);
      }
    }
  }

  if (partial && Object.keys(normalized).length === 0) {
    errors.push('Debes enviar al menos un campo para actualizar.');
  }

  if (normalized.identification !== undefined) {
    if (typeof normalized.identification !== 'string' || normalized.identification.length < 4 || normalized.identification.length > 32) {
      errors.push('identification debe tener entre 4 y 32 caracteres.');
    }
  }

  if (normalized.full_name !== undefined) {
    if (typeof normalized.full_name !== 'string' || normalized.full_name.length < 3 || normalized.full_name.length > 150) {
      errors.push('full_name debe tener entre 3 y 150 caracteres.');
    }
  }

  if (normalized.email !== undefined) {
    if (typeof normalized.email !== 'string' || normalized.email.length > 180 || !validateEmail(normalized.email)) {
      errors.push('email no tiene un formato valido.');
    }
  }

  if (normalized.phone !== undefined) {
    if (typeof normalized.phone !== 'string' || normalized.phone.length < 7 || normalized.phone.length > 40) {
      errors.push('phone debe tener entre 7 y 40 caracteres.');
    }
  }

  if (normalized.address !== undefined) {
    if (typeof normalized.address !== 'string' || normalized.address.length < 5 || normalized.address.length > 255) {
      errors.push('address debe tener entre 5 y 255 caracteres.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: normalized
  };
}

export { CLIENT_FIELDS, validateClientPayload, validateEmail };
