import { memo } from "react";
import { Award, Briefcase, Users } from "lucide-react";
import type { Job } from "@/app/lib/jobs";
import type { JobStats } from "@/app/lib/api-jobs";

interface StatsGridProps {
  jobs: Job[];
  /** Server-computed counts across all pages; when present, the client-side
   * reduce over (possibly partial) loaded jobs is skipped. */
  stats?: JobStats | null;
}

export const StatsGrid = memo(function StatsGrid({ jobs, stats }: StatsGridProps) {
  let total: number;
  let interviews: number;
  let offers: number;
  if (stats) {
    // Cheap sync check first — prefer the server's numbers over a partial list.
    total = stats.total;
    interviews = stats.interviewing;
    offers = stats.offer;
  } else {
    // Fallback (local mode, or a stats outage): single pass for all counts.
    const counts = jobs.reduce(
      (acc, job) => {
        if (job.stage === "Interviewing") acc.interviews += 1;
        else if (job.stage === "Offer") acc.offers += 1;
        return acc;
      },
      { interviews: 0, offers: 0 }
    );
    total = jobs.length;
    interviews = counts.interviews;
    offers = counts.offers;
  }

  const cards = [
    { label: "Total Applications", value: total, Icon: Briefcase },
    { label: "Interviews", value: interviews, Icon: Users },
    { label: "Offers", value: offers, Icon: Award },
  ];

  return (
    <section
      aria-label="Application statistics"
      className="mb-16 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6"
    >
      {cards.map(({ label, value, Icon }) => (
        <div
          key={label}
          className="rounded-[20px] border border-line bg-surface p-7 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)]"
        >
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted">
            <Icon size={14} aria-hidden />
            {label}
          </div>
          <div className="font-mono text-[2rem] font-bold leading-none tracking-[-0.03em] text-ink">
            {value}
          </div>
        </div>
      ))}
    </section>
  );
});
