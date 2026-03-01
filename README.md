# Simulacro Backend Hibrido

Base inicial del backend para el simulacro (Node.js + Express + Axios).
El proyecto usa ECMAScript Modules (`import/export`).

## Stack
- Node.js
- Express
- Axios
- MySQL (siguiente fase)
- MongoDB (siguiente fase)

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
```

## Endpoints creados en esta fase
- `GET /api/health` -> estado del servicio
- `GET /api/clients`
- `GET /api/clients/:id`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`
- `GET /api/reports/total-paid-by-client`
- `GET /api/reports/pending-invoices`
- `GET /api/reports/transactions-by-platform`
- `GET /api/clients/:email/history`

Nota: excepto `health`, los endpoints estan como `501 Not Implemented` para completar por partes.

## Comandos
```bash
npm install
npm run dev
npm start
```

## Variables de entorno
Revisa `.env.example`.

## Proximas fases
1. Conexion MySQL y creacion de esquema en 3FN.
2. CRUD completo de `clients` con validaciones.
3. Migracion idempotente desde `data.xlsx`/`data.txt`.
4. Reportes SQL.
5. MongoDB `client_histories` y endpoint de historial.
