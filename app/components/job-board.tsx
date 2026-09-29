"use client";

import { useCallback, useState } from "react";
import type { Job, Stage, StageFilter } from "@/app/lib/jobs";
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
}: JobBoardProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StageFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Derived during render — no effect needed to keep the list in sync.
  const search = query.trim().toLowerCase();
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
  const isFiltered = search !== "" || filter !== "all";

  // Derived during render — no effect (rerender-derived-state-no-effect).
  const visibleJobs = serverPaginated ? filteredJobs : filteredJobs.slice(0, visibleCount);

  // Reset pagination in the event handlers (rerender-move-effect-to-event).
  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleFilterChange = useCallback((f: StageFilter) => {
    setFilter(f);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleLoadMore = useCallback(
    () =>
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredJobs.length)),
    [filteredJobs.length]
  );

  return (
    <>
      <StatsGrid jobs={jobs} />
      <SearchControls
        query={query}
        filter={filter}
        onQueryChange={handleQueryChange}
        onFilterChange={handleFilterChange}
      />
      <JobList
        jobs={visibleJobs}
        // With a search/filter active only loaded pages are searchable, so the
        // best known total is the filtered length; otherwise the server's.
        totalCount={
          serverPaginated ? (isFiltered ? filteredJobs.length : totalCount) : filteredJobs.length
        }
        hasMore={serverPaginated ? hasMore === true : visibleCount < filteredJobs.length}
        onLoadMore={serverPaginated ? onLoadMore : handleLoadMore}
        onCreateJob={onCreateJob}
        onStageChange={onStageChange}
        onEditJob={onEditJob}
      />
    </>
  );
}
