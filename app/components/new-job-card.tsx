import { memo } from "react";
import type { FormEvent, InputHTMLAttributes, KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { formatElapsed, type Job } from "@/app/lib/jobs";
import { Collapsible } from "./collapsible";

/** Identity of the new-job card in the list's single-expansion state. */
export const NEW_JOB_ID = "new";

interface NewJobCardProps {
  onCreateJob: (job: Job) => void;
  expanded: boolean;
  onToggle: (id: string) => void;
  onCollapse: () => void;
}

const inputClasses =
  "w-full rounded-[10px] border border-line bg-canvas p-3 text-[0.9375rem] text-ink outline-none transition-all duration-200 focus:border-accent focus:ring-4 focus:ring-accent-soft";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

function Field({ id, label, ...inputProps }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wider text-muted"
      >
        {label}
      </label>
      <input id={id} {...inputProps} className={inputClasses} />
    </div>
  );
}

export const NewJobCard = memo(function NewJobCard({
  onCreateJob,
  expanded,
  onToggle,
  onCollapse,
}: NewJobCardProps) {
  const toggle = () => onToggle(NEW_JOB_ID);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    onCreateJob({
      id: String(Date.now()),
      title: String(data.get("position") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      stage: "Applied",
      elapsed: formatElapsed(String(data.get("appliedDate") ?? "").trim()),
      hrContact: String(data.get("hrContact") ?? "").trim() || "N/A",
      url: String(data.get("url") ?? "").trim() || "#",
    });

    form.reset();
    onCollapse();
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-dashed border-line transition-all duration-250 hover:border-accent hover:bg-accent-soft">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="grid cursor-pointer grid-cols-[auto_1fr] items-center gap-4 px-7 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div className="flex size-13 shrink-0 items-center justify-center rounded-[14px] border border-line bg-surface text-muted shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <Plus size={24} aria-hidden />
        </div>
        <div>
          <h3 className="text-[0.9375rem] font-medium text-ink">Add new job...</h3>
          <p className="text-[0.9375rem] text-muted">Click to enter details</p>
        </div>
      </div>
      <Collapsible expanded={expanded}>
        <form onSubmit={handleSubmit} className="mt-2 border-t border-line px-7 py-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] items-end gap-6">
            <Field
              id="new-job-company"
              label="Company"
              name="company"
              type="text"
              required
              placeholder="e.g. Acme Corp"
            />
            <Field
              id="new-job-url"
              label="URL"
              name="url"
              type="text"
              placeholder="https://..."
            />
            <Field
              id="new-job-hr"
              label="HR Contact"
              name="hrContact"
              type="text"
              placeholder="Name or email"
            />
            <Field
              id="new-job-position"
              label="Position"
              name="position"
              type="text"
              required
              placeholder="e.g. Engineer"
            />
            <Field
              id="new-job-date"
              label="Applied Date"
              name="appliedDate"
              type="date"
            />
            <button
              type="submit"
              className="flex h-10.5 cursor-pointer items-center justify-center rounded-[10px] bg-accent px-6 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0"
            >
              Create Job
            </button>
          </div>
        </form>
      </Collapsible>
    </div>
  );
});
