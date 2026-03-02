# Simulacro DBB

Hybrid exam project for SQL + NoSQL data management:
- `backend/`: Node.js + Express API with MySQL and MongoDB.
- `frontend/`: Vite client used as a minimal dashboard and API tester.

## 1. System Overview

This project solves a fintech data organization scenario:
- Migrates disorganized source files (`.xlsx`, `.csv`, `.txt`, `.tsv`) into structured storage.
- Uses MySQL for transactional integrity and reporting.
- Uses MongoDB for fast client history reads.
- Exposes CRUD + report + migration endpoints.

## 2. Tech Stack

- Node.js (ES Modules)
- Express
- MySQL (`mysql2`)
- MongoDB (`mongodb`)
- Multer + xlsx
- Vite + vanilla JS frontend

## 3. Prerequisites

- Node.js 18+
- MySQL running locally
- MongoDB running locally

## 4. Database Setup (Critical)

Use the same database name in:
- `backend/.env` (`DB_NAME` / `MYSQL_DATABASE`, and `MONGO_DATABASE`)
- MySQL schema target
- MongoDB database

If names are different, migrations can fail or write to the wrong DB.

Important:
- `backend/sql/schema.sql` currently includes `CREATE DATABASE ... simulacro_dbb` and `USE simulacro_dbb`.
- If you want to use a different name such as `fintech_management`, either:
  - update those first lines in `schema.sql`, or
  - keep everything as `simulacro_dbb` in `.env` and Mongo.

### 4.1 Create MySQL database

Example with `fintech_management`:

```bash
mysql -h 127.0.0.1 -P 3306 -u <user> -p -e "CREATE DATABASE IF NOT EXISTS fintech_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Then apply schema (after updating DB name inside `sql/schema.sql`):

```bash
cd backend
mysql -h 127.0.0.1 -P 3306 -u <user> -p fintech_management < sql/schema.sql
```

### 4.2 Create MongoDB database and collection

```bash
mongosh --quiet --eval "use fintech_management; db.createCollection('client_histories'); db.client_histories.createIndex({ clientEmail: 1 }, { unique: true });"
```

## 5. Environment Configuration

Configure `backend/.env` (or start from `backend/.env.example`):

```env
PORT=3000
API_PREFIX=/api

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=fintech_management

MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DATABASE=fintech_management
MONGO_CLIENT_HISTORIES_COLLECTION=client_histories
```

## 6. Install and Run

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## 7. Access URLs

- Frontend: `http://127.0.0.1:5173`
- API base: `http://127.0.0.1:3000/api`

## 8. Migration Input Files

- `backend/uploads/data.xlsx`
- `backend/uploads/data.csv`
- `backend/uploads/test_migration_required_columns.csv`

Required headers for migrations are enforced by backend parser.

## 9. Status Enum Compatibility

Current valid values:
- `invoices.status`: `Pending`, `Partial`, `Paid`
- `transactions.status`: `Pending`, `Completed`, `Failed`

If you see `Data truncated for column 'status'`, your MySQL table enum is outdated.
Re-apply `backend/sql/schema.sql` to align enums.

## 10. Additional Technical Docs

- Detailed backend documentation: [backend/README.md](backend/README.md)
- Frontend documentation: [frontend/README.md](frontend/README.md)
- Step-by-step adaptation guide: [guia_adaptacion_examen_mysql_mongo.md](guia_adaptacion_examen_mysql_mongo.md)
