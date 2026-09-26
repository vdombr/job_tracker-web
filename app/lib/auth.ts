/**
 * Versioned localStorage key for the auth token. The payload is the raw JWT
 * string returned by `POST /sign_in` — nothing else. Bump the version suffix
 * when the stored shape changes.
 */
const TOKEN_KEY = "job-tracker.auth.token.v1";

/** Stored token, or `null` when nothing valid is stored (incl. SSR). */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    // Storage access throws in some private modes — treat as signed out.
    return null;
  }
}

/** Persists the token; warns on failure (quota exceeded, private mode). */
export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.warn("Failed to persist auth token to localStorage:", error);
  }
}

/** Removes the stored token (e.g. on sign out). */
export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage may be entirely unavailable — nothing to clean up.
  }
}

/**
 * Same-origin fetch for the backend API. Paths are prefixed with `/api`, which
 * nginx proxies to the Rivulet app (the prefix is stripped), so no CORS is
 * involved. When a token is stored it is attached as `Authorization: Bearer`.
 */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`/api${path}`, { ...init, headers });
}
