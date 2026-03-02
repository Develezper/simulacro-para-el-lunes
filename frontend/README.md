# Simulacro Frontend (Vite)

Minimal frontend dashboard for testing the backend API.

## 1. Purpose

This frontend provides simple pages to validate:
- Health check
- Client CRUD flow
- SQL reports
- MongoDB client history
- File migration upload

It is intentionally lightweight and focused on functionality.

## 2. Stack

- Vite
- Vanilla JavaScript (ES Modules)
- Axios
- HTML/CSS (multi-page setup)

## 3. Prerequisites

- Node.js 18+
- Backend API running at `http://127.0.0.1:3000/api`

## 4. Install and Run

```bash
cd frontend
npm install
npm run dev
```

Default URL:
- `http://127.0.0.1:5173`

## 5. Pages

- `index.html`: dashboard + health check
- `clients.html`: list/search/delete clients
- `client-create.html`: create client
- `client-edit.html`: update client
- `reports.html`: SQL reports
- `history.html`: Mongo history by email
- `migration.html`: file upload and migration

## 6. API Integration

API base URL is defined in:
- `shared/apiClient.js` -> `API_BASE_URL`

Current default:
- `http://127.0.0.1:3000/api`

If backend host/port changes, update that constant.

## 7. Build and Preview

```bash
npm run build
npm run preview
```

