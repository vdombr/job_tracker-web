import type { Job } from "@/app/lib/jobs";
import { JobCard } from "./job-card";
import { NewJobCard } from "./new-job-card";

interface JobListProps {
  jobs: Job[];
  onCreateJob: (job: Job) => void;
}

export function JobList({ jobs, onCreateJob }: JobListProps) {
  return (
    <section aria-label="Job applications" className="flex flex-col gap-4">
      <NewJobCard onCreateJob={onCreateJob} />
      {jobs.length === 0 ? (
        <p className="py-20 text-center text-muted">
          No jobs found. Start by adding a new record above.
        </p>
      ) : (
        jobs.map((job) => <JobCard key={job.id} job={job} />)
      )}
    </section>
  );
}
