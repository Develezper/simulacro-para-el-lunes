# Simulacro Hybrid Backend - ExpertSoft Fintech

Professional backend API built with a hybrid architecture:
- MySQL for transactional integrity and relational reporting.
- MongoDB for fast client history reads.
- Node.js + Express as the REST API layer.

Implemented with ECMAScript Modules (`import/export`).

## 1. Goal

Organize denormalized financial information (Excel/CSV/TXT files) into a consistent backend with:
- 3NF relational model.
- Idempotent migration.
- Client CRUD.
- SQL reports.
- Consolidated client history in MongoDB.

## 2. Architecture

Layered structure:

```text
src/
  config/        # environment and database connections
  middlewares/   # error and 404 handlers
  modules/
    clients/     # CRUD
    reports/     # analytical SQL queries
    migration/   # file ingestion + upserts
    histories/   # Mongo reads/writes
    health/      # health check
  routes/        # route composition
  app.js         # global middlewares
  index.js       # server bootstrap
sql/             # relational schema
uploads/         # input files and evidence files
```

## 3. Data Design

### 3.1 SQL Model (3NF)

Tables: `clients`, `platforms`, `invoices`, `transactions` in [sql/schema.sql](sql/schema.sql).

Normalization rationale:
- Client data is separated from transactions to avoid redundancy and update anomalies.
- Platform catalog is isolated in its own table (`platforms`).
- Invoices are separate from transactions and linked via FKs for historical integrity.
- Uniqueness constraints (`identification`, `email`, `invoice_number`, `txn_code`) enforce consistency.

Integrity and safety:
- FKs with `ON UPDATE CASCADE` and `ON DELETE RESTRICT`.
- `CHECK` constraints for amounts and billing period format.
- Indexes for frequently queried columns (status, dates, foreign keys).

### 3.2 MongoDB Model

Collection: `client_histories`.

One document per client with an embedded transaction array. Used by `GET /api/clients/:email/history` to optimize full-history reads without SQL joins.

## 4. SQL vs Mongo Decisions

- SQL: transactional operations, structural validations, aggregated reports, relationships.
- Mongo: document-based read model for full client history.

Consistency strategy:
- Migration processes each row and updates both engines.
- MySQL uses `INSERT ... ON DUPLICATE KEY UPDATE` for idempotency.
- Mongo uses upsert by `clientEmail` and transaction dedupe by `txnCode`.

## 5. Migration and Idempotency

Endpoint: `POST /api/migration/upload`.

Features:
- Accepts `.xlsx`, `.csv`, `.txt`, `.tsv` in the `file` field.
- Includes a reference CSV artifact in `uploads/data.csv` (converted from base Excel file).
- Robust parser for quoted delimited data and multiline values.
- Excel serial date conversion to `YYYY-MM-DD HH:mm:ss`.
- Idempotent upserts in MySQL and MongoDB.
- Auto-generated normalization evidence in `uploads/evidencias/*.json`.

Endpoint response:
- `summary`: operational counters.
- `normalizationSummary`: deduplication summary.
- `normalizationEvidenceFile`: generated evidence JSON path.

## 6. Endpoints

### 6.1 Health
- `GET /api/health`

### 6.2 Clients (MySQL)
- `GET /api/clients`
- `GET /api/clients/:id`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`
  - Deletion removes related `transactions` and `invoices` within a SQL transaction.

### 6.3 Reports (MySQL)
- `GET /api/reports/total-paid-by-client`
- `GET /api/reports/pending-invoices`
- `GET /api/reports/transactions-by-platform?platform=Nequi`

### 6.4 History (MongoDB)
- `GET /api/clients/:email/history`

### 6.5 Migration
- `POST /api/migration/upload`

## 7. Local Normalization Utility

File: [normalizacion.js](normalizacion.js)

Recommended:

```bash
npm run normalize:data
```

Manual:

```bash
node normalizacion.js uploads/data.xlsx --out uploads/normalizado.json
```

Output:
- Deduplicated `clients`, `platforms`, `invoices`, `transactions`.
- Processing summary with unique counts.

## 8. Configuration

Use `.env` (see `.env.example`).

Compatibility:
- MySQL supports both `MYSQL_*` and `DB_*` variables.
- Optional local socket support with `DB_SOCKET` / `MYSQL_SOCKET`.

Example:

```env
PORT=3000
MIGRATION_CONCURRENCY=8
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=simulacro_dbb
DB_CONNECTION_LIMIT=10

MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DATABASE=simulacro_dbb
MONGO_CLIENT_HISTORIES_COLLECTION=client_histories
```

Performance note:
- `MIGRATION_CONCURRENCY` controls parallel row processing during migration.
- Recommended local range: `6` to `12`, depending on machine capacity.

## 9. Run

Install:

```bash
npm install
```

Create SQL schema:

```bash
mysql -u <user> -p < sql/schema.sql
```

Start API:

```bash
npm run dev
```

## 10. Test Frontend (Vite + HTML/CSS/JS)

A minimal frontend for API testing is included under `../frontend/`.

Usage:
1. Start backend from `backend/` with `npm run dev`.
2. In another terminal: `cd ../frontend && npm install && npm run dev`.
3. Open `http://127.0.0.1:5173`.
4. Verify API base URL points to `http://127.0.0.1:3000/api`.
5. Use pages/forms to test health, clients, reports, history, and migration.

## 11. Quick Troubleshooting

- `Access denied for user ...`:
  - Check `DB_USER`, `DB_PASSWORD`, user privileges, and selected DB.
- `Incorrect datetime value ...` during migration:
  - Check source date formats and parser mapping.
- History not found (`404`):
  - Run migration first to populate `client_histories`.
- Mongo timeout/connection issue:
  - Check URI, credentials, network access, and DB name.

## 12. Technical References

- Express: https://expressjs.com/
- mysql2: https://www.npmjs.com/package/mysql2
- MongoDB Node Driver: https://www.npmjs.com/package/mongodb
- Multer: https://www.npmjs.com/package/multer
- SheetJS/xlsx: https://www.npmjs.com/package/xlsx

## 13. Delivery Status

Implemented:
- 3NF SQL schema.
- Client CRUD.
- SQL reports.
- Idempotent migration with evidence.
- Mongo client history by email.
