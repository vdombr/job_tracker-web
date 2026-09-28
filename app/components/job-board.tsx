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
}

/**
 * Presentational board: owns query/filter/pagination state and renders the
 * stats grid, search controls, and job list. Data-source-agnostic — both the
 * local (localStorage) and API trackers render it with their own callbacks.
 */
export function JobBoard({ jobs, onCreateJob, onStageChange, onEditJob }: JobBoardProps) {
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

  // Derived during render — no effect (rerender-derived-state-no-effect).
  const visibleJobs = filteredJobs.slice(0, visibleCount);

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
        totalCount={filteredJobs.length}
        hasMore={visibleCount < filteredJobs.length}
        onLoadMore={handleLoadMore}
        onCreateJob={onCreateJob}
        onStageChange={onStageChange}
        onEditJob={onEditJob}
      />
    </>
  );
}
