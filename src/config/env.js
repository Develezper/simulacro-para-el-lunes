import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  apiPrefix: process.env.API_PREFIX || '/api',
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 7000)
};

if (Number.isNaN(env.port) || env.port <= 0) {
  throw new Error('PORT debe ser un numero valido mayor que 0');
}

if (Number.isNaN(env.requestTimeoutMs) || env.requestTimeoutMs <= 0) {
  throw new Error('REQUEST_TIMEOUT_MS debe ser un numero valido mayor que 0');
}

export { env };
