# Simulacro Arquitectura Backend Hibrida -- ExpertSoft Fintech

## Objetivo general
Disenar e implementar una API backend profesional utilizando una arquitectura hibrida:

- MSQL (Base de datos relacionales)
- MongoDB (Base de datos documentales)
- Node.js + Express (API REST)

El objetivo es que el estudiante comprenda:

- Normalizacion de datos (3FN)
- Integridad referencial
- Arquitectura por capas
- Diferencias entre SQL y NoSQL
- Consistencia entre motores de base de datos
- Migracion e importacion de datos

## Contexto del Problema
Eres parte del equipo de desarrollo asignado por ExpertSoft, una empresa de software que desarrolla productos para el sector electrico en Colombia.

En la actualidad, uno de los clientes de ExpertSoft enfrenta dificultades en la gestion de informacion financiera proveniente de plataformas Fintech como Nequi y Daviplata, ya que los datos estan desorganizados y dispersos en multiples archivos de Excel (`.xlsx`).

Tu mision como desarrollador es proponer e implementar una solucion que permita organizar y estructurar esta informacion en una base de datos SQL, facilitando su carga, almacenamiento y posterior administracion mediante un sistema CRUD, junto con consultas clave que respondan a las necesidades del cliente.

## Parte 1 -- Diseno en MSQL
### Requisito
Disenar el modelo relacional aplicando normalizacion hasta Tercera Forma Normal (3FN).

### Tablas obligatorias
`clients`
- `id` (PK)
- `identification` (UNIQUE)
- `full_name`
- `email` (UNIQUE)
- `phone`
- `address`

`platforms`
- `id` (PK)
- `name` (UNIQUE)

`invoices`
- `id` (PK)
- `invoice_number` (UNIQUE)
- `billing_period`
- `billed_amount`
- `paid_amount`
- `status`
- `client_id` (FK)

`transactions`
- `id` (PK)
- `txn_code` (UNIQUE)
- `txn_date`
- `amount`
- `status`
- `transaction_type`
- `client_id` (FK)
- `platform_id` (FK)
- `invoice_id` (FK)

## Parte 2 -- Diseno en MongoDB
Crear la coleccion:

`client_histories`

Un documento por cliente:

```json
{
  "clientEmail": "cliente@mail.com",
  "clientName": "Cliente Demo",
  "transactions": [
    {
      "txnCode": "TXN-1002",
      "date": "2024-06-01",
      "platform": "Nequi",
      "invoiceNumber": "FAC7068",
      "amount": 38940
    }
  ]
}
```

Justificacion: MongoDB se usara para consultas rapidas del historial completo del cliente sin necesidad de JOINs.

## Parte 3 -- Migracion de Datos
Deben desarrollar un script (Multer) de migracion que:

- Lea el archivo Excel.
- Inserte datos unicos en MSQL.
- Cree o actualice documentos en MongoDB.
- Sea idempotente (no debe duplicar datos si se ejecuta varias veces).

## Parte 4 - Endpoints obligatorios
### Clientes (MSQL)
- `GET /api/clients`
- `GET /api/clients/:id`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`

### Reportes (MSQL)
- `GET /api/reports/total-paid-by-client`
- `GET /api/reports/pending-invoices`
- `GET /api/reports/transactions-by-platform?platform=Nequi`

### Historial de Cliente (MongoDB)
- `GET /api/clients/:email/history`

Debe responder con el documento completo del cliente.

## Arquitectura recomendada(a su gusto)
Separacion obligatoria:

- `index` -> logica de negocio
- `config` -> conexiones a bases de datos
- `uploads`

## Criterios de evaluacion
| Criterio | Peso |
|---|---:|
| Normalizacion correcta | 20% |
| Uso correcto de SQL vs Mongo | 25% |
| Migracion idempotente | 20% |
| API funcionando | 20% |
| Arquitectura limpia | 15% |

## Entregables
- Script SQL de creacion de tablas.
- Proyecto Node funcional.
- Script de migracion.
- Base MySQL poblada.
- Base MongoDB poblada.
- README explicando decisiones tecnicas.

## Objetivo final
Que el coder entienda que:

- SQL garantiza integridad y consistencia.
- MongoDB optimiza la lectura de documentos completos.
- La arquitectura importa mas que el codigo.
- Disenar bien la base de datos evita problemas futuros.

Simulacro disenado para nivel backend profesional.
