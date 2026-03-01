CREATE DATABASE IF NOT EXISTS simulacro_dbb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE simulacro_dbb;

CREATE TABLE IF NOT EXISTS clients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  identification VARCHAR(32) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_clients_identification (identification),
  UNIQUE KEY uq_clients_email (email)
);

CREATE TABLE IF NOT EXISTS platforms (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  UNIQUE KEY uq_platforms_name (name)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(30) NOT NULL,
  billing_period CHAR(7) NOT NULL,
  billed_amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('Pendiente', 'Parcial', 'Pagada') NOT NULL DEFAULT 'Pendiente',
  client_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invoices_invoice_number (invoice_number),
  CONSTRAINT ck_invoices_billed_amount CHECK (billed_amount >= 0),
  CONSTRAINT ck_invoices_paid_amount CHECK (paid_amount >= 0 AND paid_amount <= billed_amount),
  CONSTRAINT ck_invoices_billing_period CHECK (billing_period REGEXP '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  CONSTRAINT fk_invoices_client FOREIGN KEY (client_id) REFERENCES clients (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  txn_code VARCHAR(30) NOT NULL,
  txn_date DATETIME NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status ENUM('Pendiente', 'Completada', 'Fallida') NOT NULL,
  transaction_type VARCHAR(80) NOT NULL,
  client_id INT UNSIGNED NOT NULL,
  platform_id SMALLINT UNSIGNED NOT NULL,
  invoice_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_transactions_txn_code (txn_code),
  KEY idx_transactions_client_id (client_id),
  KEY idx_transactions_platform_id (platform_id),
  KEY idx_transactions_invoice_id (invoice_id),
  KEY idx_transactions_txn_date (txn_date),
  KEY idx_transactions_status (status),
  CONSTRAINT ck_transactions_amount CHECK (amount >= 0),
  CONSTRAINT fk_transactions_client FOREIGN KEY (client_id) REFERENCES clients (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_transactions_platform FOREIGN KEY (platform_id) REFERENCES platforms (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_transactions_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);
