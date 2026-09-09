import type { ReactNode } from "react";

interface CollapsibleProps {
  expanded: boolean;
  children: ReactNode;
}

/**
 * Animates height via a grid-rows transition (works for any content height)
 * and keeps collapsed content out of the tab order with `inert`.
 */
export function Collapsible({ expanded, children }: CollapsibleProps) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div inert={!expanded} className="overflow-hidden">
        {children}
      </div>
    </div>
  );
}
