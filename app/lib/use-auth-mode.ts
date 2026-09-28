"use client";

import { useSyncExternalStore } from "react";
import { getToken, isSessionExpired, subscribeToAuth } from "@/app/lib/auth";

export type AuthMode = "local" | "api" | "expired";

/** Stable server snapshot — the token only exists in client-side storage. */
const getServerSnapshot = () => null;

/**
 * Resolves which data source the app should use, keyed off the stored JWT:
 * - no token    → "local" (existing localStorage behavior)
 * - token set   → "api" (fetch from the backend)
 * - session dead→ "expired" (prompt to sign in again)
 *
 * Mirrors the useSyncExternalStore pattern from use-stored-jobs: the server and
 * first client render see `null` ("local"), so there is no hydration mismatch;
 * after mount the real mode resolves from storage.
 *
 * Token expiry isn't checked here — the backend enforces the `exp` claim and
 * answers 401 for expired tokens, which the API client turns into
 * `markSessionExpired()` (see api-jobs.ts), flipping this to "expired".
 */
export function useAuthMode(): AuthMode {
  const token = useSyncExternalStore(subscribeToAuth, getToken, getServerSnapshot);

  if (token === null) return isSessionExpired() ? "expired" : "local";
  return "api";
}
