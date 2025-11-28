import { ApiResponse } from "../../shared/types"
let adminToken: string | null = null;
export function setAdminToken(token: string | null) {
  adminToken = token;
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (adminToken && path.startsWith('/api/admin')) {
    headers.set('x-admin-token', adminToken);
  }
  const res = await fetch(path, { ...init, headers });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}