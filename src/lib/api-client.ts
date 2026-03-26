import { ApiResponse } from "../../shared/types";
import { useUserStore } from "@/stores/userStore";
let adminToken: string | null = null;
export function setAdminToken(token: string | null) {
  adminToken = token;
}
/**
 * Enhanced API fetcher with detailed error diagnostics and safe URL construction.
 */
export async function api<T>(path: string, init?: RequestInit & { params?: Record<string, any> }): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  // Attach admin token if targeting admin endpoints
  if (adminToken && path.startsWith('/api/admin')) {
    headers.set('x-admin-token', adminToken);
  }
  // Construct final URL with query parameters
  let urlObj: URL;
  try {
    // Ensure absolute URL construction
    urlObj = new URL(path, window.location.origin);
    if (init?.params) {
      Object.entries(init.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          urlObj.searchParams.set(key, String(value));
        }
      });
    }
  } catch (err) {
    console.error(`[API URL Error] Invalid path: ${path}`, err);
    throw new Error(`Invalid request URL: ${path}`);
  }
  const finalInit = { ...init };
  delete finalInit.params;
  try {
    const res = await fetch(urlObj.toString(), { ...finalInit, headers });
    // Handle session expiration or unauthorized access
    if (res.status === 401) {
      console.warn(`[API 401] Unauthorized: ${path}`);
      setAdminToken(null);
      // Directly call store action if possible, or trigger global event
      useUserStore.getState().logout();
      if (path.startsWith('/api/admin')) {
        throw new Error('Administrative session expired. Please verify your token.');
      }
    }
    const text = await res.text();
    let json: ApiResponse<T>;
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch (e) {
      console.error(`[API Parse Error] ${path}: Non-JSON response`, text.slice(0, 200));
      throw new Error(`Cloud Protocol Error: ${res.status} ${res.statusText}`);
    }
    if (!res.ok || !json.success || json.data === undefined) {
      const errorMsg = json.error || `Request failed with status ${res.status}`;
      console.error(`[API Logic Error] ${path}:`, errorMsg);
      throw new Error(errorMsg);
    }
    return json.data;
  } catch (error) {
    // Log as a critical fetch failure (likely network or worker crash)
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API Critical Failure] ${path}: ${message}`);
    throw error;
  }
}