# ExpertSoft Fintech - Hybrid Backend Architecture (MySQL + MongoDB)

## 1. Project Overview
This project solves ExpertSoft's internal fintech data problem by centralizing fragmented `.xlsx` payment files (Nequi/Daviplata) into a hybrid backend architecture:

- MySQL for transactional consistency and referential integrity.
- MongoDB for fast denormalized read of each client's full history.
- Node.js + Express API with layered architecture.

The solution includes:
- Normalized relational model (3NF).
- Idempotent migration from Excel/CSV using Multer.
- Robust `clients` CRUD API.
- Mandatory SQL reports.
- MongoDB endpoint for consolidated client history.
- Generic CRUD engine (`/api/generic/*`) configurable for any domain.

## 2. Architecture
`backend/src` is organized by responsibility:

- `index.js`: app bootstrap and middleware setup.
- `config`: MySQL and MongoDB connections.
- `routes`: API route definitions.
- `controllers`: HTTP layer.
- `services`: business logic orchestration.
- `repositories`: database data-access layer.
- `models`: MongoDB schemas.
- `middlewares`: centralized error and 404 handlers.
- `utils`: upload handler, validators, converters.

This separation keeps the code scalable, testable, and reusable.

## 3. Data Model
### MySQL tables
- `clients`
- `platforms`
- `invoices`
- `transactions`

Primary/foreign keys and constraints are defined in [`sql/database.sql`](sql/database.sql).

### MongoDB collection
- `client_histories`

Each document stores one client and their consolidated transactions.

## 4. Normalization Justification (3NF)
Detailed analysis is documented in [`docs/normalizacion.md`](docs/normalizacion.md).

Summary:
- 1NF: atomic columns, one fact per row.
- 2NF: separation of client/platform/invoice attributes away from transaction fact.
- 3NF: transitive dependencies removed via dedicated entities and foreign keys.

## 5. SQL Constraints and Performance
The relational schema includes:
- PK/FK with `ON UPDATE CASCADE` and `ON DELETE RESTRICT`.
- `UNIQUE` on natural business identifiers.
- `CHECK` constraints for amount integrity and period format.
- Indexes on report-heavy columns (`txn_date`, `client_id`, `platform_id`, `invoice_id`).

## 6. Setup
## Prerequisites
- Node.js 18+
- MySQL 8+
- MongoDB 6+

## Environment variables
Create `backend/.env` from `backend/.env.example`.

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fintech_management
DB_CONNECTION_LIMIT=10
MONGO_URI=mongodb://127.0.0.1:27017/fintech_management
```

## Install dependencies
```bash
cd backend
npm install
```

## Create schema
Run [`sql/database.sql`](sql/database.sql) on MySQL.

## Run server
```bash
cd backend
npm run dev
```

Health check:
- `GET /health`

## 7. Migration Flow (Idempotent)
Endpoint:
- `POST /api/migration/upload`

Request:
- `multipart/form-data`
- field name: `file`

What migration does:
1. Reads first sheet from Excel/CSV.
2. Validates required columns and value formats.
3. Upserts records in sequence:
   - `platforms`
   - `clients`
   - `invoices`
   - `transactions`
4. Rebuilds Mongo `client_histories` by email.

Why idempotent:
- Upserts use unique keys (`name`, `identification`, `email`, `invoice_number`, `txn_code`).
- Re-running migration updates rows instead of duplicating them.

## 8. API Endpoints
### Clients
- `GET /api/clients`
- `GET /api/clients/:id`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`

### Reports
- `GET /api/reports/total-paid-by-client`
- `GET /api/reports/pending-invoices`
- `GET /api/reports/transactions-by-platform?platform=Nequi`

### Mongo History
- `GET /api/clients/:email/history`

### Migration
- `POST /api/migration/upload`

### Generic template endpoints (Reusable)
- `GET /api/meta/resources`
- `GET /api/generic/:resource`
- `GET /api/generic/:resource/:id`
- `POST /api/generic/:resource`
- `PUT /api/generic/:resource/:id`
- `DELETE /api/generic/:resource/:id`

## 9. How to adapt to any problem domain
This project now includes a generic CRUD layer so you can reuse the same code for:
- Hospital systems
- Schools/colleges
- Employees/workers
- Guests/events
- Products/inventory

Adaptation steps:
1. Create/update your relational tables in `sql/database.sql`.
2. Configure resources in [`backend/src/config/genericResources.js`](backend/src/config/genericResources.js):
   - `table`, `idField`, `selectFields`, `fields`, enums and required fields.
3. Start backend and use:
   - `/api/generic/:resource` from any client.
   - `frontend/generic.html` for dynamic testing without writing extra frontend code.
4. Keep domain-specific endpoints only for special logic (reports, migrations, workflows).

## 10. Error Handling and Validation
- Uniform JSON error responses.
- Payload validation for client CRUD.
- Migration row-level validation with row numbers.
- Duplicate/constraint conflicts mapped to business HTTP codes (400/404/409/500).

## 11. Evidence Files
- Enunciado: [`docs/enunciado_examen_integrado.md`](docs/enunciado_examen_integrado.md)
- DER: `docs/DER.png`
- SQL schema: [`sql/database.sql`](sql/database.sql)
- SQL reports: [`sql/queries.sql`](sql/queries.sql)
- Mongo collection contract: [`mongo/collections.json`](mongo/collections.json)

## 12. Technical Decisions
- SQL keeps strong consistency for transactional data.
- MongoDB optimizes full-history reads without expensive joins.
- Layered architecture isolates concerns and improves maintainability.
- Idempotent migration prevents repeated-load corruption.
- Generic metadata-driven CRUD reduces rewrite effort between projects.
