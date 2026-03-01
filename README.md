# Simulacro DBB - Entrega Final

Estructura del proyecto:
- `backend/`: API REST (Node.js + Express), MySQL + MongoDB, migracion, pruebas y documentacion tecnica.
- `frontend/`: cliente Vite (HTML/CSS/JS) para probar los endpoints del backend.

## Documentacion principal
La documentacion completa del examen, decisiones tecnicas, arquitectura, normalizacion, endpoints y troubleshooting esta en:

- [backend/README.md](backend/README.md)

## Ejecucion rapida
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

URLs:
- Frontend: `http://127.0.0.1:5173`
- API Base URL: `http://127.0.0.1:3000/api`

## Archivo base de migracion
Para pruebas y normalizacion se usa como archivo principal:

- `backend/uploads/data.xlsx`
