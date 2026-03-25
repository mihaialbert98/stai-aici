// Client-side fetch wrapper.
// Centralises base headers, JSON parsing, and 401 redirect.
// Usage:
//   const data = await api.get<{ tasks: Task[] }>('/api/host/tasks?propertyId=xxx');
//   const result = await api.post('/api/host/tasks', { propertyId, title });

import { toast } from 'sonner';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    toast.error('Sesiunea a expirat. Te rugăm să te autentifici din nou.');
    window.location.href = '/auth/login';
    return Promise.reject(new Error('Unauthorized'));
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? `HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  delete: <T>(url: string, body?: unknown) => request<T>('DELETE', url, body),
};
