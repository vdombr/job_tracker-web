"use client";

import { useCallback, useState } from "react";
import type { Job, Stage, StageFilter } from "@/app/lib/jobs";
import { JobList } from "./job-list";
import { SearchControls } from "./search-controls";
import { StatsGrid } from "./stats-grid";

interface JobTrackerProps {
  initialJobs: Job[];
}

export function JobTracker({ initialJobs }: JobTrackerProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StageFilter>("all");

  // Derived during render — no effect needed to keep the list in sync.
  const search = query.trim().toLowerCase();
  const filteredJobs = jobs.filter(
    (job) =>
      (filter === "all" || job.stage === filter) &&
      (search === "" ||
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search))
  );

  const handleCreateJob = useCallback((job: Job) => {
    setJobs((current) => [job, ...current]);
  }, []);

  const handleStageChange = useCallback((id: string, stage: Stage) => {
    setJobs((current) =>
      current.map((job) => (job.id === id ? { ...job, stage } : job))
    );
  }, []);

  return (
    <>
      <StatsGrid jobs={jobs} />
      <SearchControls
        query={query}
        filter={filter}
        onQueryChange={setQuery}
        onFilterChange={setFilter}
      />
      <JobList
        jobs={filteredJobs}
        onCreateJob={handleCreateJob}
        onStageChange={handleStageChange}
      />
    </>
  );
}
