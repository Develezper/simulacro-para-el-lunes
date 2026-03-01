# Simulacro Backend Hibrido

Base inicial del backend para el simulacro (Node.js + Express + Axios).
El proyecto usa ECMAScript Modules (`import/export`).

## Stack
- Node.js
- Express
- Axios
- MySQL
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
sql/
```

## Endpoints implementados
- `GET /api/health` -> estado del servicio
- `GET /api/clients` -> listado
- `GET /api/clients/:id` -> detalle
- `POST /api/clients` -> crear
- `PUT /api/clients/:id` -> actualizar
- `DELETE /api/clients/:id` -> eliminar
- `GET /api/reports/total-paid-by-client`
- `GET /api/reports/pending-invoices`
- `GET /api/reports/transactions-by-platform`
- `GET /api/clients/:email/history`

Nota: los endpoints de reportes e historial aun estan en `501 Not Implemented`.

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

## Proximas fases
1. Migracion idempotente desde `data.xlsx`/`data.txt` usando Multer.
2. Implementacion de reportes SQL.
3. MongoDB `client_histories` y endpoint de historial.
