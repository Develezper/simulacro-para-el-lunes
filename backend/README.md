# Simulacro Backend Hibrido - ExpertSoft Fintech

API backend profesional basada en arquitectura hibrida con:
- MySQL para integridad transaccional y reportes relacionales.
- MongoDB para lectura rapida de historial por cliente.
- Node.js + Express como capa REST.

Proyecto implementado en ECMAScript Modules (`import/export`).

## 1. Objetivo
Organizar informacion financiera desnormalizada (archivos Excel/CSV/TXT) en un backend consistente, con:
- Modelo relacional en 3FN.
- Migracion idempotente.
- CRUD de clientes.
- Reportes SQL.
- Historial consolidado por cliente en MongoDB.

## 2. Arquitectura
Estructura por capas:

```text
src/
  config/        # conexiones y variables de entorno
  middlewares/   # manejo de errores y 404
  modules/
    clients/     # CRUD
    reports/     # consultas analiticas SQL
    migration/   # carga de archivos + upserts
    histories/   # lectura/escritura Mongo
    health/      # health check
  routes/        # composicion de rutas
  app.js         # middlewares globales
  index.js       # bootstrap servidor
sql/             # esquema relacional
uploads/         # archivos de entrada y evidencias
```

## 3. Diseno de datos

### 3.1 Modelo SQL (3FN)
Tablas: `clients`, `platforms`, `invoices`, `transactions` en [sql/schema.sql](sql/schema.sql).

Justificacion de normalizacion:
- Datos de cliente separados de transacciones para evitar redundancia y anomalias de actualizacion.
- Catalogo de plataformas desacoplado en tabla independiente (`platforms`).
- Facturas separadas de transacciones y vinculadas por FK para conservar integridad historica.
- Restricciones de unicidad (`identification`, `email`, `invoice_number`, `txn_code`) para garantizar consistencia.

Integridad y seguridad de datos:
- FKs con `ON UPDATE CASCADE` y `ON DELETE RESTRICT`.
- `CHECK` para montos y formato de periodo de facturacion.
- Indices en columnas de consulta frecuente (estado, fecha, llaves foraneas).

### 3.2 Modelo MongoDB
Coleccion: `client_histories`.

Un documento por cliente con arreglo de transacciones. Se usa para responder `GET /api/clients/:email/history` sin JOINs, optimizando lectura completa de historial.

## 4. Decisiones SQL vs Mongo
- SQL: operaciones transaccionales, validaciones estructurales, reportes agregados y relaciones.
- Mongo: lectura documental del historial completo por cliente.

Estrategia de consistencia:
- La migracion procesa cada fila y actualiza ambos motores.
- En MySQL se usa `INSERT ... ON DUPLICATE KEY UPDATE` para idempotencia.
- En Mongo se hace upsert por `clientEmail` y deduplicacion de transaccion por `txnCode`.

## 5. Migracion e idempotencia
Endpoint: `POST /api/migration/upload`.

Caracteristicas:
- Acepta `.xlsx`, `.csv`, `.txt`, `.tsv` en campo `file`.
- Parser robusto para delimitados con comillas y saltos de linea.
- Conversion de fecha Excel serial a `YYYY-MM-DD HH:mm:ss`.
- Upserts idempotentes en MySQL y MongoDB.
- Genera evidencia automatica en `uploads/evidencias/*.json`.

Resultado del endpoint:
- `summary`: conteos operativos.
- `normalizationSummary`: resumen de deduplicacion.
- `normalizationEvidenceFile`: ruta del JSON de evidencia.

## 6. Endpoints

### 6.1 Health
- `GET /api/health`

### 6.2 Clientes (MySQL)
- `GET /api/clients`
- `GET /api/clients/:id`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`

### 6.3 Reportes (MySQL)
- `GET /api/reports/total-paid-by-client`
- `GET /api/reports/pending-invoices`
- `GET /api/reports/transactions-by-platform?platform=Nequi`

### 6.4 Historial (MongoDB)
- `GET /api/clients/:email/history`

### 6.5 Migracion
- `POST /api/migration/upload`

## 7. Normalizacion local
Archivo: [normalizacion.js](normalizacion.js)

Uso recomendado:
```bash
npm run normalize:data
```

Uso manual:
```bash
node normalizacion.js uploads/data.xlsx --out uploads/normalizado.json
```

Salida:
- `clients`, `platforms`, `invoices`, `transactions` deduplicados.
- Resumen de filas procesadas y unicos.

## 8. Configuracion
Variables en `.env` (ver tambien `.env.example`).

Compatibilidad:
- MySQL: se puede configurar con `MYSQL_*` o `DB_*`.
- Soporte opcional a socket local con `DB_SOCKET` / `MYSQL_SOCKET`.

Ejemplo base:
```env
PORT=3000
MIGRATION_CONCURRENCY=8
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=jpvlz
DB_PASSWORD=solodios
DB_NAME=fintech_management
DB_CONNECTION_LIMIT=10

MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?appName=Cluster0
MONGO_DATABASE=fintech_management
MONGO_CLIENT_HISTORIES_COLLECTION=client_histories
```

Nota de rendimiento:
- `MIGRATION_CONCURRENCY` controla cuantas filas se procesan en paralelo durante la migracion.
- Recomendado: `6` a `12` en local, segun capacidad de MySQL/Mongo.

## 9. Ejecucion
Instalacion:
```bash
npm install
```

Crear esquema SQL:
```bash
mysql -u <user> -p < sql/schema.sql
```

Levantar API:
```bash
npm run dev
```

## 10. Pruebas y verificacion
Smoke tests:
```bash
npm run test
npm run test:api
```

Verificacion de endpoints:
```bash
npm run verify:endpoints
VERIFY_MIGRATION_FILE=uploads/data.xlsx npm run verify:endpoints
```

## 11. Frontend de prueba (HTML/CSS/JS)
Se incluyo un frontend simple para probar el backend en:
- `frontend/index.html`
- `frontend/styles.css`
- `frontend/app.js`

Uso:
1. Levanta el backend con `npm run dev`.
2. Abre `frontend/index.html` en el navegador.
3. Verifica que `Base URL API` apunte a `http://127.0.0.1:3000/api`.
4. Usa botones/formularios para probar health, clientes, reportes, historial y migracion.

## 12. Troubleshooting rapido
- `Access denied for user ...`:
  - validar `DB_USER`, `DB_PASSWORD`, permisos del usuario y DB objetivo.
- `Incorrect datetime value ...` durante migracion:
  - verificar parser de fechas y formato origen del archivo.
- Historial no encontrado (`404`):
  - ejecutar migracion primero para poblar `client_histories`.
- Timeout/conexion Mongo Atlas:
  - revisar credenciales, IP allowlist y nombre de base.

## 13. Recursos tecnicos
- Express: https://expressjs.com/
- mysql2: https://www.npmjs.com/package/mysql2
- MongoDB Node Driver: https://www.npmjs.com/package/mongodb
- Multer: https://www.npmjs.com/package/multer
- SheetJS/xlsx: https://www.npmjs.com/package/xlsx

## 14. Estado del entregable
Completado:
- Esquema SQL en 3FN.
- CRUD clientes.
- Reportes SQL.
- Migracion idempotente con evidencia.
- Historial Mongo por email.
- Pruebas smoke y script de verificacion.

Pendiente recomendado (mejora continua):
- tests de integracion mas profundos (casos de error de infraestructura).
- logging estructurado y metricas de observabilidad.
