function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  if (err?.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'Registro duplicado: la informacion debe ser unica';
  }

  if (err?.code === 'ER_ROW_IS_REFERENCED' || err?.code === 'ER_ROW_IS_REFERENCED_2') {
    status = 409;
    message = 'No se puede eliminar o actualizar el registro porque tiene dependencias relacionadas';
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
