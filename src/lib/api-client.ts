import { ApiResponse } from "../../shared/types";
import { useUserStore } from "@/stores/userStore";
let adminToken: string | null = null;
export function setAdminToken(token: string | null) {
  adminToken = token;
}
export async function api<T>(path: string, init?: RequestInit & { params?: Record<string, any> }): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  // Apply admin token if it exists and we're hitting an admin endpoint
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
  try {
    const res = await fetch(fullPath, { ...finalInit, headers });
    // Handle authentication failures globally
    if (res.status === 401) {
      setAdminToken(null);
      // Access store state outside of React lifecycle to clear session
      useUserStore.getState().logout();
      // If this was an admin request, we throw to be caught by the UI
      if (path.startsWith('/api/admin')) {
        throw new Error('Unauthorized admin access. Please log in again.');
      }
    }
    const json = (await res.json()) as ApiResponse<T>;
    if (!res.ok || !json.success || json.data === undefined) {
      throw new Error(json.error || 'Request failed');
    }
    return json.data;
  } catch (error) {
    console.error(`[API Error] ${path}:`, error);
    throw error;
  }
}