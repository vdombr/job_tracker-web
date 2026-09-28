"use client";

import Link from "next/link";
import type { Job } from "@/app/lib/jobs";
import { useAuthMode } from "@/app/lib/use-auth-mode";
import { ApiJobTracker } from "./api-job-tracker";
import { LocalJobTracker } from "./local-job-tracker";

interface JobTrackerProps {
  initialJobs: Job[];
}

/**
 * Data-source dispatcher, keyed off the stored JWT:
 * - "api"     → backend-backed tracker (authenticated)
 * - "expired" → sign-in prompt (a token was present but is no longer valid)
 * - "local"   → existing localStorage behavior (anonymous)
 */
export function JobTracker({ initialJobs }: JobTrackerProps) {
  const mode = useAuthMode();

  if (mode === "api") return <ApiJobTracker />;
  if (mode === "expired") return <SessionExpiredPrompt />;
  return <LocalJobTracker initialJobs={initialJobs} />;
}

/** Shown when a stored token expired or was rejected by the API. */
function SessionExpiredPrompt() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[20px] border border-line bg-surface px-8 py-16 text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)]">
      <p className="text-sm font-medium text-ink">Your session has expired.</p>
      <p className="text-sm text-muted">
        Sign in again to continue tracking your applications.
      </p>
      <Link
        href="/sign-in"
        className="h-10.5 rounded-[10px] bg-accent px-6 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0"
      >
        Sign in
      </Link>
    </div>
  );
}
