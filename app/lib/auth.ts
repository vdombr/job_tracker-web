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

// Change notifications for useSyncExternalStore subscribers (mirrors storage.ts).
const listeners = new Set<() => void>();

function notifySubscribers(): void {
  for (const listener of listeners) listener();
}

/** Subscribes to auth token changes; returns the unsubscribe function. */
export function subscribeToAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Set when a stored token is found expired or rejected by the API (401). Kept
// separate from the token itself: clearing the token alone would make the
// snapshot `null` and the UI would silently fall back to local mode instead of
// showing the "session expired" prompt. Reset on the next successful sign-in.
let sessionExpired = false;

/** True when the last stored session was invalidated (expired or 401). */
export function isSessionExpired(): boolean {
  return sessionExpired;
}

/** Flags the session as expired and clears the token (notifies subscribers). */
export function markSessionExpired(): void {
  if (sessionExpired && getToken() === null) return; // already in this state
  sessionExpired = true;
  clearToken();
}

/** Persists the token, clears any expired flag, and notifies subscribers. */
export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.warn("Failed to persist auth token to localStorage:", error);
  }
  sessionExpired = false;
  notifySubscribers();
}

/** Removes the stored token (e.g. on sign out) and notifies subscribers. */
export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage may be entirely unavailable — nothing to clean up.
  }
  notifySubscribers();
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
