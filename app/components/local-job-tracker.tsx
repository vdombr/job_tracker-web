"use client";

import { useCallback } from "react";
import type { Job, Stage } from "@/app/lib/jobs";
import { useStoredJobs } from "@/app/lib/use-stored-jobs";
import { JobBoard } from "./job-board";

interface LocalJobTrackerProps {
  initialJobs: Job[];
}

/** Anonymous mode: job list persisted to localStorage (existing behavior). */
export function LocalJobTracker({ initialJobs }: LocalJobTrackerProps) {
  const { jobs, setJobs } = useStoredJobs(initialJobs);

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

  return (
    <JobBoard
      jobs={jobs}
      onCreateJob={handleCreateJob}
      onStageChange={handleStageChange}
      onEditJob={handleEditJob}
    />
  );
}
