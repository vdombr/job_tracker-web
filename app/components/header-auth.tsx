"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { fetchUser, type User } from "@/app/lib/api-jobs";
import { clearToken } from "@/app/lib/auth";
import { useAuthMode } from "@/app/lib/use-auth-mode";

const LOGIN_BUTTON_CLASS =
  "flex h-10 shrink-0 items-center justify-center rounded-[10px] bg-accent px-5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0";

/**
 * Header auth widget. The token lives in localStorage, so the signed-in state
 * can only be resolved on the client — this renders a plain "Login" link until
 * hydration confirms an API session, then swaps in the user's name and a
 * sign-out control.
 */
export function HeaderAuth() {
  const mode = useAuthMode();
  const [user, setUser] = useState<User | null>(null);

  // Only fetches in API mode; the `cancelled` flag discards results from a
  // request abandoned by a mode change. (No reset needed on leaving "api":
  // the stale value is never rendered, and re-entering API mode remounts this
  // component via the sign-in page.)
  useEffect(() => {
    if (mode !== "api") return;
    let cancelled = false;
    fetchUser()
      .then((loaded) => {
        if (!cancelled) setUser(loaded);
      })
      .catch(() => {
        // A 401 here has already flipped the mode via markSessionExpired.
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (mode !== "api") {
    return (
      <Link href="/sign-in" className={LOGIN_BUTTON_CLASS}>
        Login
      </Link>
    );
  }

  return (
    <div className="flex h-10 shrink-0 items-center gap-3 rounded-[10px] border border-line bg-surface pl-4 pr-2">
      <span className="text-sm font-medium text-ink">{user?.name ?? "Account"}</span>
      <button
        type="button"
        onClick={() => clearToken()}
        title="Sign out"
        aria-label="Sign out"
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-200 hover:bg-accent-soft hover:text-accent"
      >
        <LogOut size={15} aria-hidden />
      </button>
    </div>
  );
}
