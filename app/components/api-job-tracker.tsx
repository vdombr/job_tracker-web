"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Job, Stage, StageFilter } from "@/app/lib/jobs";
import {
  createJob,
  fetchJobsPage,
  fetchStats,
  updateJob,
  type JobStats,
} from "@/app/lib/api-jobs";
import { JobBoard } from "./job-board";

type Status = "loading" | "error" | "ready";

/** Idle time (ms) before a burst of search keystrokes is sent to the server. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Authenticated mode: job list loaded from the backend API with server-side
 * pagination (one page at a time, appended via "Load more"). Mutations are
 * optimistic — local state updates immediately and the request is issued in
 * the background; on failure the change is reverted, a notice is shown, and
 * the list is re-fetched to restore consistency with the server.
 */
export function ApiJobTracker() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Stage filter — sent to the server on every list fetch; pagination then
  // runs over the filtered set.
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  // Search: the raw input (instant, cheap re-render per keystroke) and the
  // debounced term actually sent to the server — typing must not fire a
  // request per key.
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Server pagination: next page to fetch (null = last page) and the server's
  // total record count for the "X of Y shown" label.
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  // Server-computed stats across all pages; null while loading or if the
  // stats endpoint failed (the grid then falls back to counting loaded jobs).
  const [stats, setStats] = useState<JobStats | null>(null);

  // Latest jobs/next-page for async handlers — avoids stale closures without
  // making the callbacks depend on state (which would churn their identity).
  const jobsRef = useRef<Job[]>([]);
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);
  const nextPageRef = useRef<number | null>(null);
  useEffect(() => {
    nextPageRef.current = nextPage;
  }, [nextPage]);
  // Current filter for the stable "Load more" callback (see jobsRef above).
  const stageFilterRef = useRef<StageFilter>("all");
  useEffect(() => {
    stageFilterRef.current = stageFilter;
  }, [stageFilter]);
  // Current debounced term for the stable "Load more" callback.
  const searchTermRef = useRef("");
  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  // Guards re-fetches from blanking the list while a full reload is in flight.
  const hasLoadedRef = useRef(false);
  // True while a "Load more" page fetch is in flight (guards double-clicks).
  const loadingMoreRef = useRef(false);
  // Bumped on every (re)load so in-flight page loads can detect they're stale.
  const generationRef = useRef(0);

  // Debounce the raw input into the server term (~300ms idle). Resetting
  // `nextPage` hides "Load more" during the fetch (like handleFilterChange);
  // a no-op timer never triggers a refetch because setState bails out on an
  // unchanged value.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      if (next !== searchTermRef.current) setNextPage(null);
      setSearchTerm(next);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const generation = ++generationRef.current;
    if (!hasLoadedRef.current) setStatus("loading");
    // A full (re)load supersedes any in-flight page load.
    loadingMoreRef.current = false;
    // The previous page's jobs stay visible until this one lands
    // (hasLoadedRef skips the skeleton).
    fetchJobsPage(1, stageFilter, searchTerm || undefined)
      .then(({ jobs: loaded, meta }) => {
        if (cancelled || generation !== generationRef.current) return;
        hasLoadedRef.current = true;
        setJobs(loaded);
        setNextPage(meta.next_page);
        setTotalRecords(meta.total_records);
        setNotice(null);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (hasLoadedRef.current) {
          // Keep the (stale) list visible and surface a notice instead.
          setNotice(
            error instanceof Error ? error.message : "Couldn't refresh your applications."
          );
        } else {
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, stageFilter, searchTerm]);

  // Stats are global (the endpoint takes no filter), so this only tracks
  // reloads — switching the stage filter must not re-fetch them.
  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((loaded) => {
        if (cancelled) return;
        setStats(loaded);
      })
      .catch(() => {
        // Non-fatal: stats stay null/last-known and the grid falls back to
        // counting loaded jobs, so a stats outage never blanks the board.
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const resync = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  /**
   * Switches the server-side stage filter. The old list stays visible until
   * the new page 1 lands; resetting `nextPage` hides "Load more" during the
   * fetch (the generation guard already discards any in-flight one).
   */
  const handleFilterChange = useCallback((filter: StageFilter) => {
    setStageFilter(filter);
    setNextPage(null);
  }, []);

  // Raw input updates are cheap; the debounce effect above coalesces them
  // into at most one server fetch per ~300ms idle window.
  const handleSearchChange = useCallback((q: string) => setSearchInput(q), []);

  /**
   * Optimistically moves one application between stage counts. Stage names are
   * the Title-Case mirror of the API's lowercase keys (see api-jobs.ts).
   */
  const moveStageStats = useCallback((from: Stage, to: Stage) => {
    if (from === to) return;
    const fromKey = from.toLowerCase() as keyof JobStats;
    const toKey = to.toLowerCase() as keyof JobStats;
    setStats((current) =>
      current
        ? { ...current, [fromKey]: current[fromKey] - 1, [toKey]: current[toKey] + 1 }
        : current
    );
  }, []);

  /**
   * Loads the next server page and appends it to the list. No-op when there
   * are no more pages or a load is already in flight; on failure the loaded
   * list is kept and a notice is shown (retry by clicking again).
   */
  const handleLoadMore = useCallback(() => {
    const page = nextPageRef.current;
    if (page === null || loadingMoreRef.current) return;
    const generation = generationRef.current;
    loadingMoreRef.current = true;
    fetchJobsPage(page, stageFilterRef.current, searchTermRef.current || undefined)
      .then(({ jobs: loaded, meta }) => {
        if (generation !== generationRef.current) return; // a resync superseded it
        loadingMoreRef.current = false;
        // Dedupe by id in case the server's ordering shifted between pages.
        setJobs((current) => {
          const seen = new Set(current.map((job) => job.id));
          return [...current, ...loaded.filter((job) => !seen.has(job.id))];
        });
        setNextPage(meta.next_page);
        setTotalRecords(meta.total_records);
      })
      .catch((error: unknown) => {
        if (generation !== generationRef.current) return;
        loadingMoreRef.current = false;
        setNotice(
          error instanceof Error ? error.message : "Couldn't load more applications."
        );
      });
  }, []);

  const handleCreateJob = useCallback(
    (job: Job) => {
      // Optimistic prepend with the temp id; replaced by the server record.
      setJobs((current) => [job, ...current]);
      setStats((current) =>
        current
          ? { ...current, total: current.total + 1, applied: current.applied + 1 }
          : current
      );
      createJob(job)
        .then((created) => {
          setNotice(null);
          setJobs((current) =>
            current.map((entry) => (entry.id === job.id ? created : entry))
          );
        })
        .catch((error: unknown) => {
          setJobs((current) => current.filter((entry) => entry.id !== job.id));
          setNotice(
            error instanceof Error ? error.message : "Couldn't save the new application."
          );
          resync();
        });
    },
    [resync]
  );

  const handleStageChange = useCallback(
    (id: string, stage: Stage) => {
      const target = jobsRef.current.find((job) => job.id === id);
      if (!target) return;
      setJobs((current) => current.map((job) => (job.id === id ? { ...job, stage } : job)));
      moveStageStats(target.stage, stage);
      // The update contract requires the full record even for a stage change.
      updateJob({ ...target, stage })
        .then((updated) => {
          setNotice(null);
          setJobs((current) => current.map((job) => (job.id === id ? updated : job)));
        })
        .catch((error: unknown) => {
          // Revert to the previous stage, then re-sync with the server.
          setJobs((current) => current.map((job) => (job.id === id ? target : job)));
          setNotice(
            error instanceof Error ? error.message : "Couldn't update the stage."
          );
          resync();
        });
    },
    [resync, moveStageStats]
  );

  const handleEditJob = useCallback(
    (updated: Job) => {
      const previous = jobsRef.current.find((job) => job.id === updated.id);
      setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
      if (previous) moveStageStats(previous.stage, updated.stage);
      updateJob(updated)
        .then((saved) => {
          setNotice(null);
          setJobs((current) => current.map((job) => (job.id === updated.id ? saved : job)));
        })
        .catch((error: unknown) => {
          if (previous) {
            setJobs((current) =>
              current.map((job) => (job.id === updated.id ? previous : job))
            );
          }
          setNotice(
            error instanceof Error ? error.message : "Couldn't save your changes."
          );
          resync();
        });
    },
    [resync, moveStageStats]
  );

  if (status === "loading") {
    return <LoadingSkeleton />;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[20px] border border-line bg-surface px-8 py-16 text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)]">
        <p className="text-sm font-medium text-ink">Couldn&apos;t load your applications.</p>
        <p className="text-sm text-muted">Check your connection and try again.</p>
        <button
          type="button"
          onClick={resync}
          className="h-10.5 cursor-pointer rounded-[10px] bg-accent px-6 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      {notice ? (
        <p
          role="alert"
          className="mb-6 rounded-lg bg-red-100 px-4 py-2.5 text-center text-sm text-red-800"
        >
          {notice}
        </p>
      ) : null}
      <JobBoard
        jobs={jobs}
        stats={stats}
        onCreateJob={handleCreateJob}
        onStageChange={handleStageChange}
        onEditJob={handleEditJob}
        hasMore={nextPage !== null}
        onLoadMore={handleLoadMore}
        totalCount={totalRecords}
        remoteFilter={stageFilter}
        onRemoteFilterChange={handleFilterChange}
        remoteQuery={searchInput}
        onRemoteQueryChange={handleSearchChange}
      />
    </>
  );
}

/** Neutral placeholder while the first fetch is in flight. */
function LoadingSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-[20px] border border-line bg-surface" />
        ))}
      </div>
      <div className="h-14 animate-pulse rounded-[20px] border border-line bg-surface" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-[20px] border border-line bg-surface" />
      ))}
    </div>
  );
}
