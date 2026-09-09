import { JobTracker } from "@/app/components/job-tracker";
import { initialJobs } from "@/app/lib/jobs";

export default function Page() {
  return (
    <>
      <header className="mx-auto w-full max-w-[1000px] px-6 pb-6 pt-12 md:px-8 md:pb-8 md:pt-16">
        <h1 className="mb-2 text-4xl font-bold tracking-[-0.035em] text-ink">
          Job Tracker
        </h1>
        <p className="text-muted">Manage your applications and track progress</p>
      </header>
      <main className="mx-auto w-full max-w-[1000px] flex-1 px-6 pb-12 md:px-8 md:pb-20">
        <JobTracker initialJobs={initialJobs} />
      </main>
    </>
  );
}
