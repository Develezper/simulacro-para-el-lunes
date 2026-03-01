# Simulacro Backend Hibrido

Base inicial del backend para el simulacro (Node.js + Express + Axios).
El proyecto usa ECMAScript Modules (`import/export`).

## Stack
- Node.js
- Express
- Axios
- MySQL
- MongoDB

## Estructura actual
```text
src/
  config/
    env.js
    httpClient.js
  middlewares/
    errorHandler.js
    notFound.js
  modules/
    clients/
    health/
    histories/
    reports/
  routes/
    index.js
  app.js
  index.js
uploads/
sql/
```

## Endpoints implementados
- `GET /api/health` -> estado del servicio
- `GET /api/clients` -> listado
- `GET /api/clients/:id` -> detalle
- `POST /api/clients` -> crear
- `PUT /api/clients/:id` -> actualizar
- `DELETE /api/clients/:id` -> eliminar
- `GET /api/reports/total-paid-by-client` -> total pagado por cliente
- `GET /api/reports/pending-invoices` -> facturas pendientes
- `GET /api/reports/transactions-by-platform?platform=Nequi` -> transacciones por plataforma
- `GET /api/clients/:email/history` -> historial del cliente (MongoDB)
- `POST /api/migration/upload` -> carga masiva idempotente con archivo en campo `file`

## Comandos
```bash
npm install
npm run dev
npm start
```

## Variables de entorno
Revisa `.env.example`.

## Esquema SQL (3FN)
El archivo [sql/schema.sql](sql/schema.sql) crea:
- `clients`
- `platforms`
- `invoices`
- `transactions`

Ejemplo de ejecucion:
```bash
mysql -u root -p < sql/schema.sql
```

## Migracion de datos
Ruta: `POST /api/migration/upload`

- Usa `multipart/form-data`.
- Campo del archivo: `file`.
- Extensiones permitidas: `.xlsx`, `.csv`, `.txt`, `.tsv`.
- Ejecuta upserts idempotentes en MySQL (`clients`, `platforms`, `invoices`, `transactions`).
- Sincroniza/actualiza `client_histories` en MongoDB por `clientEmail`.

Ejemplo:
```bash
curl -X POST http://localhost:3000/api/migration/upload \
  -F "file=@uploads/data.txt"
```

## Proximas fases
1. Agregar tests de integracion para CRUD, reportes y migracion.
2. Endurecer validaciones de negocio (estados, periodos, montos).
3. Documentar decisiones de modelado y tradeoffs SQL vs Mongo con mayor detalle.
