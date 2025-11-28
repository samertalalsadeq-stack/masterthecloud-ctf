import { ApiResponse } from "../../shared/types"
let adminToken: string | null = null;
export function setAdminToken(token: string | null) {
  adminToken = token;
}
export async function api<T>(path: string, init?: RequestInit & { params?: Record<string, any> }): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (adminToken && path.startsWith('/api/admin')) {
    headers.set('x-admin-token', adminToken);
  }
  let fullPath = path;
  if (init?.params) {
    const url = new URL(path, window.location.origin);
    Object.entries(init.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    fullPath = `${url.pathname}${url.search}`;
  }
  const finalInit = { ...init };
  delete finalInit.params;
  const res = await fetch(fullPath, { ...finalInit, headers });
  if (res.status === 401 && adminToken) {
    setAdminToken(null); // Simple token invalidation
  }
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}