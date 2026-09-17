import { STAGES, type Job } from "@/app/lib/jobs";

/**
 * Versioned localStorage key for the persisted job list. The payload is a bare
 * JSON array of `Job` objects — minimal and self-describing. Bump the version
 * suffix when the shape changes; migrate by reading the old key, transforming,
 * and writing under the new one.
 */
const STORAGE_KEY = "job-tracker.jobs.v1";

/** Type guard for a persisted job; rejects missing fields and unknown stages. */
function isJob(value: unknown): value is Job {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.company === "string" &&
    typeof candidate.stage === "string" &&
    (STAGES as readonly string[]).includes(candidate.stage) &&
    typeof candidate.appliedDate === "string" &&
    typeof candidate.hrContact === "string" &&
    typeof candidate.url === "string" &&
    typeof candidate.commentary === "string"
  );
}

// Change notifications for useSyncExternalStore subscribers.
const listeners = new Set<() => void>();

// In-memory snapshot cache. useSyncExternalStore requires getSnapshot to return
// a stable reference for unchanged storage, so parse results are cached by raw
// payload and only re-parsed when the stored string actually changes.
let cachedRaw: string | null | undefined;
let cachedJobs: Job[] | null = null;

/**
 * Parses a stored payload into jobs, or `null` when nothing valid is stored.
 * A corrupt payload removes its key so the next save starts clean; individual
 * invalid entries are dropped so partial corruption degrades gracefully.
 */
function parsePayload(raw: string | null): Job[] | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError("payload is not an array");
    return parsed.filter(isJob);
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be entirely unavailable (e.g. blocked in private mode);
      // there is nothing to clean up.
    }
    return null;
  }
}

/** Latest stored jobs, or `null` when nothing valid is stored (incl. SSR). */
export function getStoredJobs(): Job[] | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage access throws in some private modes — treat as empty.
    return null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedJobs = parsePayload(raw);
  }
  return cachedJobs;
}

/**
 * Persists jobs and notifies subscribers. On failure (quota exceeded, private
 * mode) the in-memory snapshot is still updated so the app keeps working
 * in-memory rather than throwing.
 */
export function setStoredJobs(jobs: Job[]): void {
  const raw = JSON.stringify(jobs);
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch (error) {
    console.warn("Failed to persist jobs to localStorage:", error);
  }
  cachedRaw = raw;
  cachedJobs = jobs;
  for (const listener of listeners) listener();
}

/** Subscribes to storage changes; returns the unsubscribe function. */
export function subscribeToStoredJobs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
