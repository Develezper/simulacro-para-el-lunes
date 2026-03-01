import { getClientHistoryByEmailService } from './histories.service.js';

async function getClientHistory(req, res) {
  const document = await getClientHistoryByEmailService(req.params.email);

  res.json({
    ok: true,
    data: document
  });
}

export { getClientHistory };
