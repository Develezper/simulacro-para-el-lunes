function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  if (err?.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'Registro duplicado: la informacion debe ser unica';
  }

  if (err?.code === 'ER_NO_SUCH_TABLE') {
    status = 500;
    message = 'No existe la tabla requerida. Ejecuta primero sql/schema.sql en MySQL.';
  }

  const response = {
    ok: false,
    message
  };

  if (err?.details) {
    response.details = err.details;
  }

  res.status(status).json(response);
}

export { errorHandler };
