import { ApiResponse } from "../../shared/types";
import { useUserStore } from "@/stores/userStore";
let adminToken: string | null = null;
const REQUEST_TIMEOUT_MS = 10000;
export function setAdminToken(token: string | null) {
  adminToken = token;
}
/**
 * Enhanced API fetcher with detailed error diagnostics and timeout protection.
 */
export async function api<T>(path: string, init?: RequestInit & { params?: Record<string, any> }): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (adminToken && path.startsWith('/api/admin')) {
    headers.set('x-admin-token', adminToken);
  }
  let urlObj: URL;
  try {
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const finalInit = { ...init, signal: controller.signal };
  delete (finalInit as any).params;
  try {
    const res = await fetch(urlObj.toString(), { ...finalInit, headers });
    clearTimeout(timeoutId);
    if (res.status === 401) {
      console.warn(`[API 401] Unauthorized: ${path}`);
      setAdminToken(null);
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
      throw new Error(`Cloud Protocol Protocol Failure: ${res.status} ${res.statusText}`);
    }
    if (!res.ok || !json.success || json.data === undefined) {
      const errorMsg = json.error || `Request failed with status ${res.status}`;
      console.error(`[API Logic Error] ${path}:`, errorMsg);
      throw new Error(errorMsg);
    }
    return json.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`[API Timeout] ${path}: Request exceeded ${REQUEST_TIMEOUT_MS}ms`);
      throw new Error('Network timeout. Please check your connection and try again.');
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API Network Failure] ${path}: ${message}`);
    throw new Error(`Communication failure: ${message}`);
  }
}