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
npm run test
npm run test:api
npm run verify:endpoints
npm run normalize:data
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
- Genera evidencia automatica en `uploads/evidencias/*.json` con resumen y datos normalizados.

Ejemplo:
```bash
curl -X POST http://localhost:3000/api/migration/upload \
  -F "file=@uploads/data.txt"
```

## Normalizacion local de archivo
`normalizacion.js` ahora es un script real para normalizar `data.xlsx/.txt/.csv` y generar colecciones deduplicadas (`clients`, `platforms`, `invoices`, `transactions`).

Comando recomendado:
```bash
npm run normalize:data
```

Uso manual:
```bash
node normalizacion.js uploads/data.xlsx --out uploads/normalizado.json
```

## Verificacion automatizada
- `npm run test:api`: smoke tests de logica/validacion y parser (sin depender de puertos, MySQL o Mongo activos).
- `npm run verify:endpoints`: verificacion completa de endpoints contra backend levantado en `http://127.0.0.1:3000/api`.
- Para incluir migracion en la verificacion:
```bash
VERIFY_MIGRATION_FILE=uploads/data.txt npm run verify:endpoints
```

## Proximas fases
1. Agregar tests de integracion para CRUD, reportes y migracion.
2. Endurecer validaciones de negocio (estados, periodos, montos).
3. Documentar decisiones de modelado y tradeoffs SQL vs Mongo con mayor detalle.
