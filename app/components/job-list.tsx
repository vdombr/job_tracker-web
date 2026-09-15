import { useCallback, useState } from "react";
import type { Job, Stage } from "@/app/lib/jobs";
import { JobCard } from "./job-card";
import { NEW_JOB_ID, NewJobCard } from "./new-job-card";

interface JobListProps {
  jobs: Job[];
  onCreateJob: (job: Job) => void;
  onStageChange: (id: string, stage: Stage) => void;
  onEditJob: (job: Job) => void;
}

export function JobList({
  jobs,
  onCreateJob,
  onStageChange,
  onEditJob,
}: JobListProps) {
  // Only one card can be expanded at a time — opening one closes the others.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Only one stage menu can be open at a time — opening one closes the others.
  const [stageMenuId, setStageMenuId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  }, []);

  const handleCollapse = useCallback(() => {
    setExpandedId(null);
  }, []);

  const handleStageMenuToggle = useCallback((id: string) => {
    setStageMenuId((current) => (current === id ? null : id));
  }, []);

  const handleStageMenuClose = useCallback(() => {
    setStageMenuId(null);
  }, []);

  return (
    <section aria-label="Job applications" className="flex flex-col gap-4">
      <NewJobCard
        onCreateJob={onCreateJob}
        expanded={expandedId === NEW_JOB_ID}
        onToggle={handleToggle}
        onCollapse={handleCollapse}
      />
      {jobs.length === 0 ? (
        <p className="py-20 text-center text-muted">
          No jobs found. Start by adding a new record above.
        </p>
      ) : (
        jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            expanded={expandedId === job.id}
            stageMenuOpen={stageMenuId === job.id}
            onToggle={handleToggle}
            onStageMenuToggle={handleStageMenuToggle}
            onStageMenuClose={handleStageMenuClose}
            onStageChange={onStageChange}
            onEdit={onEditJob}
          />
        ))
      )}
    </section>
  );
}
