function getHealth(_req, res) {
  res.json({
    ok: true,
    service: 'simulacro-backend',
    timestamp: new Date().toISOString()
  });
}

export { getHealth };
