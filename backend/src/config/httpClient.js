import axios from 'axios';
import { env } from './env.js';

const httpClient = axios.create({
  timeout: env.requestTimeoutMs,
  headers: {
    'Content-Type': 'application/json'
  }
});

export { httpClient };
