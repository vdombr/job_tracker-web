"use client";

import { useCallback, useState } from "react";
import type { Job, Stage, StageFilter } from "@/app/lib/jobs";
import type { JobStats } from "@/app/lib/api-jobs";
import { JobList } from "./job-list";
import { SearchControls } from "./search-controls";
import { StatsGrid } from "./stats-grid";

const PAGE_SIZE = 10;

interface JobBoardProps {
  jobs: Job[];
  onCreateJob: (job: Job) => void;
  onStageChange: (id: string, stage: Stage) => void;
  onEditJob: (job: Job) => void;
  /** API mode: more server pages are available. */
  hasMore?: boolean;
  /** API mode: fetch the next server page. */
  onLoadMore?: () => void;
  /** API mode: total record count reported by the server. */
  totalCount?: number;
  /** API mode: server-computed stats across all pages; when absent, the grid
   * counts only the loaded jobs (local mode never passes it). */
  stats?: JobStats | null;
  /** API mode: externally controlled stage filter. When both this and
   * `onRemoteFilterChange` are provided, the chip state is driven by them and
   * changes are reported up instead of stored internally (local mode keeps
   * its internal state). */
  remoteFilter?: StageFilter;
  onRemoteFilterChange?: (filter: StageFilter) => void;
  /** API mode: externally controlled search term. When both this and
   * `onRemoteQueryChange` are provided, the input is driven by them and
   * changes are reported up instead of stored internally (local mode keeps
   * its internal state). */
  remoteQuery?: string;
  onRemoteQueryChange?: (query: string) => void;
}

/**
 * Presentational board: owns query/filter state and renders the stats grid,
 * search controls, and job list. Data-source-agnostic — both the local
 * (localStorage) and API trackers render it with their own callbacks. When
 * `onLoadMore`/`totalCount` are provided (API mode), paging is server-side
 * and the client-side slicing is skipped; otherwise the board slices locally.
 */
export function JobBoard({
  jobs,
  onCreateJob,
  onStageChange,
  onEditJob,
  hasMore,
  onLoadMore,
  totalCount,
  stats,
  remoteFilter,
  onRemoteFilterChange,
  remoteQuery,
  onRemoteQueryChange,
}: JobBoardProps) {
  const [internalQuery, setInternalQuery] = useState("");
  const [internalFilter, setInternalFilter] = useState<StageFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Controlled (API mode) or internal (local mode) — derived during render,
  // no sync effect (rerender-derived-state-no-effect).
  const filter = onRemoteFilterChange ? remoteFilter ?? "all" : internalFilter;
  const query = onRemoteQueryChange ? remoteQuery ?? "" : internalQuery;

  // Derived during render — no effect needed to keep the list in sync. In API
  // mode the server owns search, so the client filter runs with an empty term
  // (local mode still filters loaded jobs by title/company).
  const search = onRemoteQueryChange ? "" : query.trim().toLowerCase();
  const filteredJobs = jobs.filter(
    (job) =>
      (filter === "all" || job.stage === filter) &&
      (search === "" ||
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search))
  );

  // API mode: the tracker pages server-side, so skip client-side slicing and
  // pass its pagination state straight through. Local mode keeps today's
  // visibleCount slicing (LocalJobTracker is untouched).
  const serverPaginated = onLoadMore !== undefined && totalCount !== undefined;

  // Derived during render — no effect (rerender-derived-state-no-effect).
  const visibleJobs = serverPaginated ? filteredJobs : filteredJobs.slice(0, visibleCount);

  // Reset pagination in the event handlers (rerender-move-effect-to-event).
  const handleQueryChange = useCallback(
    (q: string) => {
      if (onRemoteQueryChange) {
        onRemoteQueryChange(q);
      } else {
        setInternalQuery(q);
        setVisibleCount(PAGE_SIZE);
      }
    },
    [onRemoteQueryChange]
  );

  const handleFilterChange = useCallback(
    (f: StageFilter) => {
      if (onRemoteFilterChange) {
        onRemoteFilterChange(f);
      } else {
        setInternalFilter(f);
        setVisibleCount(PAGE_SIZE);
      }
    },
    [onRemoteFilterChange]
  );

  const handleLoadMore = useCallback(
    () =>
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredJobs.length)),
    [filteredJobs.length]
  );

  return (
    <>
      <StatsGrid jobs={jobs} stats={stats} />
      <SearchControls
        query={query}
        filter={filter}
        onQueryChange={handleQueryChange}
        onFilterChange={handleFilterChange}
      />
      <JobList
        jobs={visibleJobs}
        // In server-paginated mode the server's total is exact for the active
        // filter+search combination; local mode counts what it has loaded.
        totalCount={serverPaginated ? totalCount : filteredJobs.length}
        hasMore={serverPaginated ? hasMore === true : visibleCount < filteredJobs.length}
        onLoadMore={serverPaginated ? onLoadMore : handleLoadMore}
        onCreateJob={onCreateJob}
        onStageChange={onStageChange}
        onEditJob={onEditJob}
      />
    </>
  );
}
