import { memo } from "react";
import { Search } from "lucide-react";
import { STAGE_FILTERS, type StageFilter } from "@/app/lib/jobs";

interface SearchControlsProps {
  query: string;
  filter: StageFilter;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: StageFilter) => void;
}

export const SearchControls = memo(function SearchControls({
  query,
  filter,
  onQueryChange,
  onFilterChange,
}: SearchControlsProps) {
  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <div className="relative w-full max-w-64 shrink">
        <Search
          size={18}
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search jobs or companies..."
          aria-label="Search jobs or companies"
          className="w-full rounded-xl border border-line bg-surface py-3 pl-11 pr-4 text-[0.9375rem] text-ink outline-none transition-all duration-200 focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
      </div>
      <div role="group" aria-label="Filter jobs by stage" className="flex shrink-0 gap-2">
        {STAGE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onFilterChange(value)}
            aria-pressed={filter === value}
            className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
              filter === value
                ? "border-accent bg-accent text-white"
                : "border-line bg-surface text-muted hover:border-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
});
