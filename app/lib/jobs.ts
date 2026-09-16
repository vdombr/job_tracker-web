export const STAGES = ["Applied", "Interviewing", "Offer", "Ghosted", "Rejected"] as const;

export type Stage = (typeof STAGES)[number];

export type StageFilter = "all" | Stage;

export interface Job {
  id: string;
  title: string;
  company: string;
  stage: Stage;
  appliedDate: string;
  hrContact: string;
  url: string;
  commentary: string;
}

export const STAGE_FILTERS: readonly { value: StageFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Applied", label: "Applied" },
  { value: "Interviewing", label: "Interviewing" },
  { value: "Offer", label: "Offer" },
  { value: "Ghosted", label: "Ghosted" },
  { value: "Rejected", label: "Rejected" },
];

export const STAGE_STYLES: Record<Stage, string> = {
  Applied: "bg-slate-100 text-slate-600",
  Interviewing: "bg-accent-soft text-accent",
  Offer: "bg-amber-100 text-amber-800",
  Ghosted: "bg-teal-100 text-teal-800",
  Rejected: "bg-red-100 text-red-800",
};

/** Dot colors for the stage menu items.
 * Kept light and saturated so they stay distinct at 8px — the dark variants
 * (amber-800/red-800) blur together, and slate-500 crowds the indigo accent. */
export const STAGE_DOTS: Record<Stage, string> = {
  Applied: "bg-slate-400",
  Interviewing: "bg-accent",
  Offer: "bg-amber-500",
  Ghosted: "bg-teal-500",
  Rejected: "bg-red-500",
};

export const initialJobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "Linear",
    stage: "Interviewing",
    appliedDate: daysAgoISO(3),
    hrContact: "Sarah Jenkins",
    url: "https://linear.app",
    commentary: "",
  },
  {
    id: "2",
    title: "Product Designer",
    company: "Vercel",
    stage: "Applied",
    appliedDate: daysAgoISO(5),
    hrContact: "Alex Rivera",
    url: "https://vercel.com",
    commentary: "",
  },
  {
    id: "3",
    title: "Software Engineer",
    company: "Notion",
    stage: "Offer",
    appliedDate: daysAgoISO(7),
    hrContact: "Sam Smith",
    url: "https://notion.so",
    commentary: "",
  },
];

/** Formats a date as YYYY-MM-DD in local time. */
function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's local date as YYYY-MM-DD. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** The local date `days` days before today, as YYYY-MM-DD (used by seed data). */
function daysAgoISO(days: number): string {
  return toISODate(new Date(Date.now() - days * 86_400_000));
}

/** Derives a human-readable "time elapsed" label from an applied date (YYYY-MM-DD). */
export function formatElapsed(appliedDate?: string): string {
  if (!appliedDate) return "Today";
  const applied = new Date(`${appliedDate}T00:00:00`);
  if (Number.isNaN(applied.getTime())) return "Today";

  // Compare midnights to midnight so the label is stable throughout the day
  // and correct across DST transitions.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - applied.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}
