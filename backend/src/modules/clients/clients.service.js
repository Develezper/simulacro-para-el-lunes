import {
  createClient,
  deleteClientById,
  findAllClients,
  findClientById,
  findClientByIdentificationOrEmail,
  updateClientById
} from './clients.repository.js';
import { createHttpError } from '../../utils/httpError.js';
import { validateClientId, validateClientPayload } from './clients.validation.js';

async function listClients() {
  return findAllClients();
}

async function getClientById(rawId) {
  const id = validateClientId(rawId);
  const client = await findClientById(id);

  if (!client) {
    throw createHttpError(404, 'Cliente no encontrado');
  }

  return client;
}

async function createClientService(payload) {
  const data = validateClientPayload(payload, { partial: false });
  const duplicated = await findClientByIdentificationOrEmail(data.identification, data.email);

  if (duplicated) {
    throw createHttpError(409, 'Ya existe un cliente con la misma identificacion o email');
  }

  return createClient(data);
}

async function updateClientService(rawId, payload) {
  const id = validateClientId(rawId);
  const changes = validateClientPayload(payload, { partial: true });
  const currentClient = await findClientById(id);

  if (!currentClient) {
    throw createHttpError(404, 'Cliente no encontrado');
  }

  const duplicated = await findClientByIdentificationOrEmail(
    changes.identification ?? currentClient.identification,
    changes.email ?? currentClient.email,
    id
  );

  if (duplicated) {
    throw createHttpError(409, 'La identificacion o el email ya estan asociados a otro cliente');
  }

  return updateClientById(id, changes);
}

async function deleteClientService(rawId) {
  const id = validateClientId(rawId);
  const existing = await findClientById(id);

  if (!existing) {
    throw createHttpError(404, 'Cliente no encontrado');
  }

  await deleteClientById(id);
}

export {
  createClientService,
  deleteClientService,
  getClientById,
  listClients,
  updateClientService
};
