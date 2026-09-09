import { memo } from "react";
import { Award, Briefcase, Users } from "lucide-react";
import type { Job } from "@/app/lib/jobs";

interface StatsGridProps {
  jobs: Job[];
}

export const StatsGrid = memo(function StatsGrid({ jobs }: StatsGridProps) {
  // Single pass over the list for all counts.
  const { interviews, offers } = jobs.reduce(
    (counts, job) => {
      if (job.stage === "Interviewing") counts.interviews += 1;
      else if (job.stage === "Offer") counts.offers += 1;
      return counts;
    },
    { interviews: 0, offers: 0 }
  );

  const stats = [
    { label: "Total Applications", value: jobs.length, Icon: Briefcase },
    { label: "Interviews", value: interviews, Icon: Users },
    { label: "Offers", value: offers, Icon: Award },
  ];

  return (
    <section
      aria-label="Application statistics"
      className="mb-16 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6"
    >
      {stats.map(({ label, value, Icon }) => (
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
