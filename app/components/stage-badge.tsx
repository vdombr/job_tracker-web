"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { STAGES, STAGE_DOTS, STAGE_STYLES, type Stage } from "@/app/lib/jobs";

interface StageBadgeProps {
  stage: Stage;
  open: boolean;
  onToggle: () => void;
  onSelect: (stage: Stage) => void;
}

const MENU_GAP = 8;

/**
 * Clickable stage pill that opens a listbox of stages. The menu is portaled
 * to `document.body` and positioned with `fixed` coordinates because the job
 * card clips its own overflow — an in-flow dropdown would be cut off.
 */
export function StageBadge({ stage, open, onToggle, onSelect }: StageBadgeProps) {
  const badgeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Viewport coordinates of the anchor, recomputed each time the menu opens.
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!open || !badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    setAnchor({ top: rect.bottom + MENU_GAP, right: window.innerWidth - rect.right });
  }, [open]);

  // Dismiss on outside press, Escape, scroll, or resize. Listeners only mount
  // while open and JobList guarantees a single open menu, so at most one set
  // of document listeners exists at a time.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (badgeRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onToggle();
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onToggle();
        badgeRef.current?.focus();
      }
    };
    const dismiss = () => onToggle();

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open, onToggle]);

  // Move focus to the current stage once the listbox is mounted.
  useEffect(() => {
    if (!open || !anchor || !menuRef.current) return;
    const options = menuRef.current.querySelectorAll<HTMLButtonElement>("[role='option']");
    const selected = Array.from(options).find(
      (el) => el.getAttribute("aria-selected") === "true"
    );
    (selected ?? options[0])?.focus();
  }, [open, anchor]);

  const handleBadgeKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" && !open) {
      event.preventDefault();
      onToggle();
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const options = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']") ?? []
    );
    if (options.length === 0) return;

    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | null = null;
    switch (event.key) {
      case "ArrowDown":
        next = Math.min(options.length - 1, current + 1);
        break;
      case "ArrowUp":
        next = Math.max(0, current - 1);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = options.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    options[next]?.focus();
  };

  return (
    <>
      <button
        ref={badgeRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        onKeyDown={handleBadgeKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Click to change stage"
        className={`cursor-pointer select-none rounded-full border border-transparent px-4 py-[0.4rem] text-xs font-semibold tracking-[0.02em] transition-all duration-200 hover:brightness-95 hover:shadow-[0_0_0_2px_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent justify-self-start md:justify-self-auto ${STAGE_STYLES[stage]}`}
      >
        {stage}
      </button>

      {open &&
        anchor &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label="Change stage"
            onKeyDown={handleMenuKeyDown}
            style={{ position: "fixed", top: anchor.top, right: anchor.right }}
            className="stage-menu z-50 min-w-36 rounded-xl border border-line bg-surface p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]"
          >
            {STAGES.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === stage}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(option);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[0.8125rem] font-medium transition-all duration-200 hover:bg-accent-soft hover:text-accent focus:bg-accent-soft focus:text-accent focus:outline-none ${
                  option === stage ? "text-accent" : "text-ink"
                }`}
              >
                <span aria-hidden className={`size-2 shrink-0 rounded-full ${STAGE_DOTS[option]}`} />
                {option}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
