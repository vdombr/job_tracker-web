"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Job } from "@/app/lib/jobs";
import {
  getStoredJobs,
  setStoredJobs,
  subscribeToStoredJobs,
} from "@/app/lib/storage";

/** Stable server snapshot — storage only exists on the client. */
const getServerSnapshot = () => null;

/**
 * Job list state persisted to localStorage.
 *
 * The server and first client render use the `null` snapshot (rendering
 * `fallback`), so stored data can never mismatch the server-rendered output;
 * after mount, React switches to the client snapshot read from storage.
 * `setJobs` persists synchronously in the calling event handler — no effects,
 * and nothing is ever written before hydration could have happened.
 */
export function useStoredJobs(fallback: Job[]) {
  const stored = useSyncExternalStore(
    subscribeToStoredJobs,
    getStoredJobs,
    getServerSnapshot
  );
  const jobs = stored ?? fallback;

  const setJobs = useCallback(
    (update: Job[] | ((current: Job[]) => Job[])) => {
      // Read the latest snapshot at call time so queued updates never see a
      // stale list.
      const current = getStoredJobs() ?? fallback;
      setStoredJobs(typeof update === "function" ? update(current) : update);
    },
    [fallback]
  );

  return { jobs, setJobs };
}
