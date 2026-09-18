import Link from "next/link";
import { JobTracker } from "@/app/components/job-tracker";
import { initialJobs } from "@/app/lib/jobs";

export default function Page() {
  return (
    <>
      <header className="mx-auto w-full max-w-250 px-6 pb-6 pt-12 md:px-8 md:pb-8 md:pt-16">
        <div className="flex items-start justify-between gap-4">
          <h1 className="mb-2 text-4xl font-bold tracking-[-0.035em] text-ink">
            Job Tracker
          </h1>
          <Link
            href="/sign-in"
            className="flex h-10 shrink-0 items-center justify-center rounded-[10px] bg-accent px-5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0"
          >
            Login
          </Link>
        </div>
        <p className="text-muted">Manage your applications and track progress</p>
      </header>
      <main className="mx-auto w-full max-w-250 flex-1 px-6 pb-12 md:px-8 md:pb-20">
        <JobTracker initialJobs={initialJobs} />
      </main>
    </>
  );
}
