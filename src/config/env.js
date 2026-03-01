import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  apiPrefix: process.env.API_PREFIX || '/api',
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 7000),
  mysqlHost: process.env.MYSQL_HOST || '127.0.0.1',
  mysqlPort: Number(process.env.MYSQL_PORT || 3306),
  mysqlUser: process.env.MYSQL_USER || 'root',
  mysqlPassword: process.env.MYSQL_PASSWORD || '',
  mysqlDatabase: process.env.MYSQL_DATABASE || 'simulacro_dbb',
  mysqlConnectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017',
  mongoDatabase: process.env.MONGO_DATABASE || 'simulacro_dbb',
  mongoClientHistoriesCollection: process.env.MONGO_CLIENT_HISTORIES_COLLECTION || 'client_histories'
};

if (Number.isNaN(env.port) || env.port <= 0) {
  throw new Error('PORT debe ser un numero valido mayor que 0');
}

if (Number.isNaN(env.requestTimeoutMs) || env.requestTimeoutMs <= 0) {
  throw new Error('REQUEST_TIMEOUT_MS debe ser un numero valido mayor que 0');
}

if (Number.isNaN(env.mysqlPort) || env.mysqlPort <= 0) {
  throw new Error('MYSQL_PORT debe ser un numero valido mayor que 0');
}

if (Number.isNaN(env.mysqlConnectionLimit) || env.mysqlConnectionLimit <= 0) {
  throw new Error('MYSQL_CONNECTION_LIMIT debe ser un numero valido mayor que 0');
}

export { env };
