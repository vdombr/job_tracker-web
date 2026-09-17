"use client";

import { useCallback, useState } from "react";
import type { Job, Stage, StageFilter } from "@/app/lib/jobs";
import { useStoredJobs } from "@/app/lib/use-stored-jobs";
import { JobList } from "./job-list";
import { SearchControls } from "./search-controls";
import { StatsGrid } from "./stats-grid";

const PAGE_SIZE = 10;

interface JobTrackerProps {
  initialJobs: Job[];
}

export function JobTracker({ initialJobs }: JobTrackerProps) {
  const { jobs, setJobs } = useStoredJobs(initialJobs);
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

  const handleCreateJob = useCallback(
    (job: Job) => {
      setJobs((current) => [job, ...current]);
    },
    [setJobs]
  );

  const handleStageChange = useCallback(
    (id: string, stage: Stage) => {
      setJobs((current) =>
        current.map((job) => (job.id === id ? { ...job, stage } : job))
      );
    },
    [setJobs]
  );

  const handleEditJob = useCallback(
    (updated: Job) => {
      setJobs((current) =>
        current.map((job) => (job.id === updated.id ? updated : job))
      );
    },
    [setJobs]
  );

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
        onCreateJob={handleCreateJob}
        onStageChange={handleStageChange}
        onEditJob={handleEditJob}
      />
    </>
  );
}
