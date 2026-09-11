export const STAGES = ["Applied", "Interviewing", "Offer", "Rejected"] as const;

export type Stage = (typeof STAGES)[number];

export type StageFilter = "all" | Stage;

export interface Job {
  id: string;
  title: string;
  company: string;
  stage: Stage;
  elapsed: string;
  hrContact: string;
  url: string;
}

export const STAGE_FILTERS: readonly { value: StageFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Applied", label: "Applied" },
  { value: "Interviewing", label: "Interviewing" },
  { value: "Offer", label: "Offer" },
];

export const STAGE_STYLES: Record<Stage, string> = {
  Applied: "bg-slate-100 text-slate-600",
  Interviewing: "bg-accent-soft text-accent",
  Offer: "bg-amber-100 text-amber-800",
  Rejected: "bg-red-100 text-red-800",
};

/** Dot colors for the stage menu items (mirrors the original design tokens). */
export const STAGE_DOTS: Record<Stage, string> = {
  Applied: "bg-slate-500",
  Interviewing: "bg-accent",
  Offer: "bg-amber-800",
  Rejected: "bg-red-800",
};

export const initialJobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "Linear",
    stage: "Interviewing",
    elapsed: "3 days ago",
    hrContact: "Sarah Jenkins",
    url: "https://linear.app",
  },
  {
    id: "2",
    title: "Product Designer",
    company: "Vercel",
    stage: "Applied",
    elapsed: "5 days ago",
    hrContact: "Alex Rivera",
    url: "https://vercel.com",
  },
  {
    id: "3",
    title: "Software Engineer",
    company: "Notion",
    stage: "Offer",
    elapsed: "1 week ago",
    hrContact: "Sam Smith",
    url: "https://notion.so",
  },
];

/** Derives a human-readable "time elapsed" label from an applied date (YYYY-MM-DD). */
export function formatElapsed(appliedDate?: string): string {
  if (!appliedDate) return "Just now";
  const applied = new Date(`${appliedDate}T00:00:00`);
  if (Number.isNaN(applied.getTime())) return "Just now";

  const days = Math.floor((Date.now() - applied.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}
