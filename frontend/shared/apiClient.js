import axios from 'axios';

const DEFAULT_TIMEOUT_MS = 20000;
const API_BASE_URL = 'http://127.0.0.1:3000/api';

function joinUrl(base, path) {
  const safePath = String(path || '').startsWith('/') ? path : `/${path}`;
  return `${base}${safePath}`;
}

function normalizeErrorPayload({ status = 500, url = '', payload = null, fallbackMessage = 'Error inesperado' } = {}) {
  const objectPayload = payload && typeof payload === 'object' ? payload : {};
  const rawMessage = objectPayload.message || (typeof payload === 'string' ? payload : '');

  return {
    ok: false,
    status,
    url,
    message: rawMessage || fallbackMessage,
    details: objectPayload.details || null,
    data: objectPayload.data || null
  };
}

function normalizeSuccessPayload(payload, status, url) {
  if (payload && typeof payload === 'object') {
    return {
      ok: payload.ok !== false,
      ...payload,
      status,
      url
    };
  }

  return {
    ok: true,
    data: payload,
    status,
    url
  };
}

async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    timeoutMs = DEFAULT_TIMEOUT_MS,
    data,
    body,
    headers,
    params
  } = options;

  const url = joinUrl(API_BASE_URL, path);

  try {
    const response = await axios({
      url,
      method,
      headers,
      params,
      timeout: timeoutMs,
      data: data ?? body,
      validateStatus: () => true
    });

    if (response.status < 200 || response.status >= 300) {
      throw normalizeErrorPayload({
        status: response.status,
        url,
        payload: response.data,
        fallbackMessage: `Error HTTP ${response.status}`
      });
    }

    return normalizeSuccessPayload(response.data, response.status, url);
  } catch (error) {
    if (error?.ok === false) {
      throw error;
    }

    if (error?.code === 'ECONNABORTED') {
      throw normalizeErrorPayload({
        status: 408,
        url,
        fallbackMessage: `La solicitud supero el tiempo limite (${Math.round(timeoutMs / 1000)}s)`
      });
    }

    throw normalizeErrorPayload({
      status: 503,
      url,
      fallbackMessage: 'No se pudo conectar al backend. Verifica que este ejecutandose y accesible.'
    });
  }
}

export { API_BASE_URL, DEFAULT_TIMEOUT_MS, apiRequest };
