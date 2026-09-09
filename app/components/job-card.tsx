import { memo, useState } from "react";
import type { KeyboardEvent } from "react";
import { Building2, Clock } from "lucide-react";
import { STAGE_STYLES, type Job } from "@/app/lib/jobs";
import { Collapsible } from "./collapsible";

interface JobCardProps {
  job: Job;
}

export const JobCard = memo(function JobCard({ job }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => setExpanded((value) => !value);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  };

  return (
    <article className="relative overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-muted hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.04)]">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="grid cursor-pointer grid-cols-[auto_1fr] items-center gap-4 px-7 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:grid-cols-[auto_1fr_auto_auto] md:gap-7"
      >
        <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] border border-line bg-surface text-muted shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <Building2 size={24} aria-hidden />
        </div>
        <div>
          <h3 className="mb-1 text-lg font-semibold tracking-[-0.02em] text-ink">
            {job.title}
          </h3>
          <p className="text-[0.9375rem] text-muted">{job.company}</p>
        </div>
        <span
          className={`justify-self-start rounded-full px-4 py-[0.4rem] text-xs font-semibold tracking-[0.02em] md:justify-self-auto ${STAGE_STYLES[job.stage]}`}
        >
          {job.stage}
        </span>
        <span className="flex items-center gap-2 justify-self-start text-sm text-muted md:justify-self-auto">
          <Clock size={14} aria-hidden />
          {job.elapsed}
        </span>
      </div>
      <Collapsible expanded={expanded}>
        <dl className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 border-t border-line px-7 py-5">
          <div className="flex flex-col gap-1.5">
            <dt className="text-xs font-semibold uppercase tracking-[0.05em] text-muted">
              HR Contact
            </dt>
            <dd className="break-all text-[0.9375rem] text-ink">
              {job.hrContact || "N/A"}
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="text-xs font-semibold uppercase tracking-[0.05em] text-muted">
              Application URL
            </dt>
            <dd className="break-all text-[0.9375rem]">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                {job.url || "#"}
              </a>
            </dd>
          </div>
        </dl>
      </Collapsible>
    </article>
  );
});
