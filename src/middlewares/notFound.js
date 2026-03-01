function notFound(req, res) {
  res.status(404).json({
    ok: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
}

export { notFound };
