# Guia de Adaptacion Rapida para Examen (MySQL + MongoDB)

Esta guia esta hecha para este proyecto y para enunciados parecidos a `enunciado_examen_integrado.md`.
Objetivo: que puedas tomar cualquier nuevo problema del examen y adaptarlo rapido sin rehacer todo desde cero.

## 1. Regla base del examen (que no cambia)

- MySQL: verdad transaccional (CRUD, relaciones, reportes con joins y agregaciones).
- MongoDB: lectura documental rapida (historial/resumen por entidad principal).
- Backend por capas: `routes -> controller -> service -> repository`.
- Migracion idempotente: si corres dos veces el mismo archivo, no debe duplicar.
- Frontend: solo consume API y refleja nuevos campos/endpoints.

Si respetas estas 5 reglas, casi cualquier variante del examen se resuelve.

## 2. Mapa mental para leer cualquier enunciado nuevo

Antes de tocar codigo, llena esta matriz:

1. Entidad principal: quien es el "cliente" del problema (cliente, proveedor, estudiante, paciente, etc.).
2. Catalogos: tablas cortas reutilizables (plataforma, sede, categoria, estado, tipo).
3. Movimientos: eventos transaccionales (pagos, ventas, reservas, atenciones, etc.).
4. Reportes obligatorios: que consultas pide literal el enunciado.
5. Documento Mongo: que vista completa se consulta sin joins.
6. Archivo de migracion: columnas que trae y llaves unicas reales.

Con eso ya sabes que va a MySQL y que va a Mongo.

## 3. Conexion a MySQL y Mongo (paso a paso)

### 3.0 Crear bases de datos correctamente (obligatorio)

Este punto evita el error mas comun del proyecto: conectar a una DB en `.env` pero crear tablas en otra DB distinta.

Regla:

1. Define un solo nombre de base, por ejemplo `fintech_management`.
2. Usa ese mismo nombre en:
   - `DB_NAME` / `MYSQL_DATABASE` (backend)
   - `MONGO_DATABASE` (backend)
   - comandos de creacion en MySQL y Mongo

Si no coinciden, el backend puede leer/escribir en bases diferentes.

Importante:

- `backend/sql/schema.sql` trae por defecto `CREATE DATABASE ... simulacro_dbb` y `USE simulacro_dbb`.
- Si usaras otro nombre (ej: `fintech_management`), primero ajusta esas lineas del SQL o unifica todo a `simulacro_dbb`.

#### 3.0.1 Crear DB en MySQL

```bash
mysql -h 127.0.0.1 -P 3306 -u <usuario> -p -e "CREATE DATABASE IF NOT EXISTS fintech_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Aplicar esquema (misma DB):

```bash
cd backend
mysql -h 127.0.0.1 -P 3306 -u <usuario> -p fintech_management < sql/schema.sql
```

Validar enums de estado:

```bash
mysql -h 127.0.0.1 -P 3306 -u <usuario> -p fintech_management -e "SHOW COLUMNS FROM invoices LIKE 'status'; SHOW COLUMNS FROM transactions LIKE 'status';"
```

Debe quedar:

- `invoices.status` = `enum('Pending','Partial','Paid')`
- `transactions.status` = `enum('Pending','Completed','Failed')`

#### 3.0.2 Crear DB y coleccion en Mongo

```bash
mongosh --quiet --eval "use fintech_management; db.createCollection('client_histories'); db.client_histories.createIndex({ clientEmail: 1 }, { unique: true });"
```

#### 3.0.3 Verificacion rapida de consistencia

En `backend/.env` verifica:

```env
DB_NAME=fintech_management
MONGO_DATABASE=fintech_management
MONGO_CLIENT_HISTORIES_COLLECTION=client_histories
```

Si ves el error `Data truncated for column 'status'`, reaplica `sql/schema.sql` sobre la DB correcta.

### 3.1 Variables de entorno

Usa `backend/.env` (puedes copiar `backend/.env.example`).

Variables clave:

```env
PORT=3000
API_PREFIX=/api

# MySQL
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=fintech_management
MYSQL_CONNECTION_LIMIT=10
# opcional por socket local:
DB_SOCKET=

# Mongo
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DATABASE=fintech_management
MONGO_CLIENT_HISTORIES_COLLECTION=client_histories
```

Notas del proyecto:

- `backend/src/config/env.js` acepta `MYSQL_*` o `DB_*`.
- Si defines `DB_SOCKET`, MySQL conecta por socket; si no, usa host/puerto.

### 3.2 Conexion MySQL

1. Crea/actualiza esquema SQL en `backend/sql/schema.sql`.
2. Ejecuta:

```bash
cd backend
mysql -h 127.0.0.1 -P 3306 -u <usuario> -p fintech_management < sql/schema.sql
```

3. Arranca backend:

```bash
npm run dev
```

Si falla:

- `ER_NO_SUCH_TABLE`: no corriste `sql/schema.sql`.
- `Access denied`: credenciales mal en `.env`.

### 3.3 Conexion Mongo

Mongo conecta con `backend/src/config/mongodb.js` usando:

- `MONGO_URI`
- `MONGO_DATABASE`
- `MONGO_CLIENT_HISTORIES_COLLECTION`

Checklist rapido:

1. Motor Mongo activo.
2. URI valida.
3. Nombre de DB correcto.
4. Coleccion correcta (por defecto `client_histories`).

Si el endpoint de historial devuelve 404, puede ser normal: aun no has migrado datos o el email no existe.

## 4. Orden recomendado para adaptar el backend a cualquier enunciado

## 4.1 Primero el modelo SQL (3FN)

Archivo: `backend/sql/schema.sql`

Checklist:

1. Define entidades maestras (tabla principal + catalogos).
2. Separa transacciones/eventos en tabla propia.
3. Define PK/FK con `ON UPDATE CASCADE`.
4. Define `UNIQUE` para llaves de negocio (email, codigo, numero, etc.).
5. Agrega `CHECK` e indices para reportes.

Tip de examen: piensa primero en `UNIQUE` y FK. Eso evita casi todos los errores de duplicados e inconsistencias.

## 4.2 Luego crea/ajusta modulos por capa

Patron existente (copialo siempre):

- `backend/src/modules/<modulo>/<modulo>.routes.js`
- `backend/src/modules/<modulo>/<modulo>.controller.js`
- `backend/src/modules/<modulo>/<modulo>.service.js`
- `backend/src/modules/<modulo>/<modulo>.repository.js`
- `backend/src/modules/<modulo>/<modulo>.validation.js` (si aplica)

Y registra rutas en:

- `backend/src/routes/index.js`

Regla:

- `repository`: SQL/Mongo puro.
- `service`: reglas de negocio/validaciones de flujo.
- `controller`: request/response.
- `routes`: define endpoints.

## 4.3 CRUD base (MySQL)

Usa `clients` como plantilla real:

- `backend/src/modules/clients/*`

Cuando cambie el dominio (ejemplo "proveedores" en vez de "clientes"):

1. Clona estructura del modulo.
2. Cambia nombres de tabla/campos en repository.
3. Ajusta validaciones en `validation`.
4. Mantiene mismo formato de respuesta `{ ok, data|message }`.

## 4.4 Reportes SQL

Usa `backend/src/modules/reports/reports.repository.js` como referencia.

Para cualquier nuevo reporte:

1. Escribe SQL primero (join/group by/order by).
2. Lo expones en repository.
3. Service valida query params obligatorios.
4. Controller responde JSON estandar.
5. Route agrega endpoint.

## 4.5 Historial Mongo

Referencia:

- `backend/src/modules/histories/histories.repository.js`
- `backend/src/modules/histories/histories.service.js`

Reglas que debes mantener:

1. Un documento por entidad principal (ej: `clientEmail`).
2. Upsert por llave de negocio estable.
3. Dedupe interno del arreglo por codigo de transaccion/evento.
4. Endpoint de lectura por identificador (`/clients/:email/history` o equivalente).

## 4.6 Migracion idempotente (clave del examen)

Flujo actual:

1. Upload multer: `backend/src/modules/migration/upload.middleware.js`
2. Parser: `backend/src/modules/migration/parsers/migration.parser.js`
3. Upserts SQL: `backend/src/modules/migration/migration.repository.js`
4. Upserts Mongo: `bulkUpsertClientHistories(...)`
5. Evidencia JSON: `uploads/evidencias/*.json`

Cuando cambie el archivo fuente:

1. Actualiza headers requeridos (`REQUIRED_HEADERS`).
2. Ajusta mapeo normalizado (`normalizeRawRows`).
3. Ajusta upserts SQL por nuevas llaves de negocio.
4. Ajusta estructura del documento Mongo.
5. Mantiene `ON DUPLICATE KEY UPDATE` + `upsert: true`.

Regla de oro: sin llaves unicas reales en SQL, no existe idempotencia.

## 5. Orden recomendado para adaptar frontend

## 5.1 Base API

Archivo: `frontend/shared/apiClient.js`

- Cambia `API_BASE_URL` solo si cambia host/puerto/prefijo.
- Mantiene `apiRequest(...)` para estandarizar errores.

## 5.2 Formularios y validaciones

Archivos:

- `frontend/shared/validators.js`
- `frontend/pages/client-create.page.js`
- `frontend/pages/client-edit.page.js`

Si cambia el dominio/campos:

1. Actualiza `CLIENT_FIELDS` y reglas de validacion.
2. Ajusta inputs en HTML (`client-create.html`, `client-edit.html`).
3. Ajusta payload que se envia al backend.

## 5.3 Listados, reportes, historial, migracion

Archivos:

- Listado: `frontend/pages/clients.page.js`
- Reportes: `frontend/pages/reports.page.js`
- Historial: `frontend/pages/history.page.js`
- Migracion: `frontend/pages/migration.page.js`

Checklist:

1. Endpoint correcto.
2. Columnas de tabla alineadas con respuesta backend.
3. Mensajes de error utiles.
4. Paginacion funcionando con datos nuevos.

## 6. Plan de ejecucion en examen (timebox recomendado)

1. 0-20 min: leer enunciado, definir modelo SQL y documento Mongo.
2. 20-50 min: adaptar `schema.sql` + correr DB.
3. 50-100 min: CRUD + reportes backend.
4. 100-140 min: migracion idempotente + parser.
5. 140-170 min: historial Mongo + endpoint.
6. 170-210 min: adaptar frontend minimo funcional.
7. 210-240 min: pruebas finales y README corto de decisiones.

## 7. Pruebas minimas que debes pasar siempre

Con backend arriba (`cd backend && npm run dev`):

```bash
# health
curl -sS http://127.0.0.1:3000/api/health

# CRUD base
curl -sS http://127.0.0.1:3000/api/clients

# reportes
curl -sS http://127.0.0.1:3000/api/reports/total-paid-by-client
curl -sS http://127.0.0.1:3000/api/reports/pending-invoices
curl -sS "http://127.0.0.1:3000/api/reports/transactions-by-platform?platform=Nequi"

# historial mongo
curl -sS http://127.0.0.1:3000/api/clients/<email>/history

# migracion
curl -sS -X POST http://127.0.0.1:3000/api/migration/upload -F "file=@uploads/data.xlsx"
```

Prueba de idempotencia:

1. corre migracion una vez.
2. corre migracion otra vez con el mismo archivo.
3. verifica que no se dupliquen registros ni transacciones.

## 8. Errores tipicos y como evitarlos

- Duplicados al migrar: falta `UNIQUE` o `ON DUPLICATE KEY UPDATE`.
- Historial roto: no deduplicas por `txnCode` en Mongo.
- Frontend vacio: columnas no coinciden con JSON de backend.
- 404 en rutas: olvidaste registrar modulo en `backend/src/routes/index.js`.
- 500 por tabla faltante: no ejecutaste `sql/schema.sql`.

## 9. Plantilla de decision SQL vs Mongo para cualquier nuevo problema

Usa esta regla:

- Va a MySQL si:
  - hay relacion fuerte entre entidades
  - se necesita integridad referencial
  - hay reportes agregados con filtros complejos

- Va a Mongo si:
  - se consulta un "documento completo" por llave de negocio
  - quieres evitar joins para esa consulta de lectura
  - es historial/listado embebido de eventos

## 10. Checklist final antes de entregar

1. `schema.sql` coherente con el nuevo dominio.
2. CRUD principal funcionando.
3. reportes del enunciado implementados.
4. endpoint Mongo funcionando.
5. migracion idempotente validada 2 veces.
6. frontend consume todos los endpoints obligatorios.
7. README explica decisiones SQL vs Mongo y arquitectura por capas.

Si completas ese checklist, quedas cubierto para casi cualquier variacion del examen.
