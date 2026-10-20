import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
});

// ── Request interceptor — attach access token ─────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle 401 with refresh ────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(normalizeError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem('access_token', data.access);
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
        processQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(original);
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(normalizeError(err as AxiosError));
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(normalizeError(error));
  }
);

function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const status = error.response?.status;
    if (data && typeof data === 'object') {
      // DRF often returns {detail: "..."} or {field: ["..."]}
      const detail = (data as Record<string, unknown>).detail;
      if (typeof detail === 'string') {
        return { message: detail, status };
      }
      // Field-level errors
      const fieldErrors: Record<string, string[]> = {};
      let firstMessage = 'Validation error';
      let hasFields = false;
      for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
        if (Array.isArray(val)) {
          fieldErrors[key] = val.map(String);
          if (!hasFields) { firstMessage = val[0] as string; hasFields = true; }
        }
      }
      return { message: firstMessage, field_errors: hasFields ? fieldErrors : undefined, status };
    }
    return { message: error.message || 'Request failed', status };
  }
  return { message: 'An unexpected error occurred' };
}

export default apiClient;
