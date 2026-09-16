import { memo, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Building2, Clock, Pencil } from "lucide-react";
import type { Job, Stage } from "@/app/lib/jobs";
import { Collapsible } from "./collapsible";
import { StageBadge } from "./stage-badge";

interface JobCardProps {
  job: Job;
  expanded: boolean;
  stageMenuOpen: boolean;
  onToggle: (id: string) => void;
  onStageMenuToggle: (id: string) => void;
  onStageMenuClose: () => void;
  onStageChange: (id: string, stage: Stage) => void;
  onEdit: (job: Job) => void;
}

const editInputClasses =
  "w-full rounded-[10px] border border-line bg-canvas p-3 text-[0.9375rem] text-ink outline-none transition-all duration-200 focus:border-accent focus:ring-4 focus:ring-accent-soft";

export const JobCard = memo(function JobCard({
  job,
  expanded,
  stageMenuOpen,
  onToggle,
  onStageMenuToggle,
  onStageMenuClose,
  onStageChange,
  onEdit,
}: JobCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const toggle = () => onToggle(job.id);

  const displayUrl =
    job.url.length > 35 ? `${job.url.slice(0, 32)}…` : job.url;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onEdit({
      ...job,
      title: String(data.get("title") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      hrContact: String(data.get("hrContact") ?? "").trim() || "N/A",
      url: String(data.get("url") ?? "").trim() || "#",
      commentary: String(data.get("commentary") ?? "").trim(),
    });
    setIsEditing(false);
  };

  return (
    <article className="relative overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-250 hover:-translate-y-0.5 hover:border-muted hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.04)]">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="grid cursor-pointer grid-cols-[auto_1fr] items-center gap-4 px-7 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:grid-cols-[auto_1fr_auto_auto] md:gap-7"
      >
        <div className="flex size-13 shrink-0 items-center justify-center rounded-[14px] border border-line bg-surface text-muted shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <Building2 size={24} aria-hidden />
        </div>
        <div>
          <h3 className="mb-1 text-lg font-semibold tracking-[-0.02em] text-ink">
            {job.title}
          </h3>
          <p className="text-[0.9375rem] text-muted">{job.company}</p>
        </div>
        <StageBadge
          stage={job.stage}
          open={stageMenuOpen}
          onToggle={() => onStageMenuToggle(job.id)}
          onSelect={(stage) => {
            onStageChange(job.id, stage);
            onStageMenuClose();
          }}
        />
        <span className="flex items-center gap-2 justify-self-start text-sm text-muted md:justify-self-auto">
          <Clock size={14} aria-hidden />
          {job.elapsed}
        </span>
      </div>
      <Collapsible expanded={expanded}>
        {isEditing ? (
          <form
            onSubmit={handleEditSubmit}
            className="mt-3 border-t border-line px-7 py-5"
          >
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] items-end gap-6">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={`edit-title-${job.id}`}
                  className="text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Position
                </label>
                <input
                  id={`edit-title-${job.id}`}
                  name="title"
                  defaultValue={job.title}
                  required
                  className={editInputClasses}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={`edit-company-${job.id}`}
                  className="text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Company
                </label>
                <input
                  id={`edit-company-${job.id}`}
                  name="company"
                  defaultValue={job.company}
                  required
                  className={editInputClasses}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={`edit-hr-${job.id}`}
                  className="text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  HR Contact
                </label>
                <input
                  id={`edit-hr-${job.id}`}
                  name="hrContact"
                  defaultValue={job.hrContact}
                  placeholder="Name or email"
                  className={editInputClasses}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={`edit-url-${job.id}`}
                  className="text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Application URL
                </label>
                <input
                  id={`edit-url-${job.id}`}
                  name="url"
                  defaultValue={job.url}
                  placeholder="https://..."
                  className={editInputClasses}
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <label
                htmlFor={`edit-commentary-${job.id}`}
                className="text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Commentary
              </label>
              <textarea
                id={`edit-commentary-${job.id}`}
                name="commentary"
                rows={3}
                defaultValue={job.commentary}
                placeholder="Notes, follow-ups, interview details…"
                className={`${editInputClasses} resize-y`}
              />
            </div>
            <div className="mt-6 flex items-center gap-4">
              <button
                type="submit"
                className="flex h-10.5 cursor-pointer items-center justify-center rounded-[10px] bg-accent px-6 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex h-10.5 cursor-pointer items-center justify-center rounded-[10px] border border-line bg-surface px-6 text-sm font-medium text-ink transition-all duration-200 hover:border-muted hover:bg-canvas"
              >
                Cancel
              </button>
          </div>
        </form>
        ) : (
          <dl className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 border-t border-line px-7 py-5">
            <div className="flex flex-col gap-1.5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                HR Contact
              </dt>
              <dd className="break-all text-[0.9375rem] text-ink">
                {job.hrContact || "N/A"}
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                Application URL
              </dt>
              <dd className="break-all text-[0.9375rem]">
                <a
                  href={job.url}
                  title={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  {displayUrl || "#"}
                </a>
              </dd>
            </div>
            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-sm font-medium text-ink transition-all duration-200 hover:border-accent hover:text-accent"
              >
                <Pencil size={15} aria-hidden />
                Edit
              </button>
            </div>
            <div className="col-span-full flex flex-col gap-1.5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                Commentary
              </dt>
              <dd className="whitespace-pre-wrap break-words text-[0.9375rem] text-ink">
                {job.commentary || "—"}
              </dd>
            </div>
          </dl>
        )}
      </Collapsible>
    </article>
  );
});
