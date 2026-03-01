import {
  createClientService,
  deleteClientService,
  getClientById,
  listClients,
  updateClientService
} from './clients.service.js';

async function getClients(_req, res) {
  const clients = await listClients();

  res.json({
    ok: true,
    data: clients
  });
}

async function getClient(req, res) {
  const client = await getClientById(req.params.id);

  res.json({
    ok: true,
    data: client
  });
}

async function createClient(req, res) {
  const client = await createClientService(req.body);

  res.status(201).json({
    ok: true,
    data: client
  });
}

async function updateClient(req, res) {
  const client = await updateClientService(req.params.id, req.body);

  res.json({
    ok: true,
    data: client
  });
}

async function deleteClient(req, res) {
  await deleteClientService(req.params.id);

  res.json({
    ok: true,
    message: 'Cliente eliminado correctamente'
  });
}

export { createClient, deleteClient, getClient, getClients, updateClient };
