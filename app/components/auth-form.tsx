"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Mail, User } from "lucide-react";
import { apiFetch, setToken } from "@/app/lib/auth";

type AuthMode = "signin" | "signup";

interface TextFieldProps {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  autoComplete?: string;
  placeholder: string;
}

function TextField({
  id,
  label,
  type,
  value,
  onChange,
  icon,
  autoComplete,
  placeholder,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-xl border border-line bg-surface py-3 pl-11 pr-4 text-[0.9375rem] text-ink outline-none transition-all duration-200 focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
      </div>
    </div>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  const isSignup = mode === "signup";

  function switchMode(next: AuthMode) {
    setMode(next);
    setStatus(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSignup) {
      if (password.length < 8) {
        setStatus("Password must be at least 8 characters.");
        return;
      }
      setStatus(
        "Demo mode — account creation isn't connected to a backend yet.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/sign_in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        setToken(await res.text());
        router.push("/");
        return;
      }
      // The backend answers 404 for both unknown emails and wrong passwords,
      // so a single message keeps accounts from being probed.
      setStatus("Invalid email or password.");
    } catch {
      setStatus(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-105">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to dashboard
      </Link>

      <div className="rounded-2xl border border-line bg-surface p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {isSignup ? "Create an account" : "Welcome back"}
        </h1>
        <p className="mb-6 mt-1 text-sm text-muted">
          {isSignup
            ? "Start tracking your applications"
            : "Sign in to your Job Tracker account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup ? (
            <TextField
              id="name"
              label="Full name"
              type="text"
              value={name}
              onChange={setName}
              icon={<User size={18} aria-hidden />}
              autoComplete="name"
              placeholder="Jane Doe"
            />
          ) : null}
          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            icon={<Mail size={18} aria-hidden />}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            icon={<Lock size={18} aria-hidden />}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "At least 8 characters" : "••••••••"}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-[10px] bg-accent py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Signing in…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        {status ? (
          <p
            role="status"
            className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-center text-sm text-muted"
          >
            {status}
          </p>
        ) : null}

        <div className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="cursor-pointer font-semibold text-accent hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="cursor-pointer font-semibold text-accent hover:underline"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
