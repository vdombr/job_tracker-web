import { todayISO, type Job, type Stage, type StageFilter } from "@/app/lib/jobs";
import { apiFetch, markSessionExpired } from "@/app/lib/auth";

/** API stage values (lowercase) ↔ frontend Title-Case stages. */
const STAGE_TO_API: Record<Stage, string> = {
  Applied: "applied",
  Interviewing: "interviewing",
  Offer: "offer",
  Ghosted: "ghosted",
  Rejected: "rejected",
};

const API_TO_STAGE: Record<string, Stage> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  ghosted: "Ghosted",
  rejected: "Rejected",
};

/** One row of the backend's JobRecord (snake_case, integer id). */
interface JobRecord {
  id: number;
  company: string | null;
  position: string | null;
  url?: string | null;
  hr_contact?: string | null;
  commentary?: string | null;
  current_stage: string | null;
  applied_at: string | null;
}

/** The backend's `meta.paginate` block for list endpoints. */
export interface PaginateMeta {
  page: number;
  limit: number;
  prev_page: number | null;
  next_page: number | null;
  total_pages: number;
  total_records: number;
}

interface ListResponse {
  data: JobRecord[];
  meta: { paginate: PaginateMeta };
}

/** Page size for server-side list pagination. */
const PAGE_SIZE = 10;

/** An API error carrying the HTTP status so callers can branch on it. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Shared request wrapper. A 401 means the session is gone (expired token or
 * revoked server-side) — flag it so every consumer drops to the sign-in prompt
 * instead of retrying with a dead token.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch {
    throw new Error("Couldn't reach the server. Check your connection.");
  }
  if (res.status === 401) {
    markSessionExpired();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    // 422 (validation) and 409 (conflict) both arrive as
    // { errors: [{ field, message }] }, with message possibly an array.
    if (res.status === 409 || res.status === 422) {
      try {
        const body = (await res.json()) as {
          errors?: { field: string; message: string | string[] }[];
        };
        const first = body.errors?.[0];
        if (first) {
          const detail = Array.isArray(first.message)
            ? first.message.join(", ")
            : first.message;
          message = `${first.field}: ${detail}`;
        }
      } catch {
        // Non-JSON error body — keep the generic message.
      }
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

/** Normalizes an API date to YYYY-MM-DD (defensive against ISO datetimes). */
function toDateOnly(value: unknown): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return todayISO();
}

/** Maps an API JobRecord to the frontend Job shape. */
export function toJob(record: JobRecord): Job {
  return {
    id: String(record.id),
    title: record.position ?? "",
    company: record.company ?? "",
    stage: API_TO_STAGE[record.current_stage ?? ""] ?? "Applied",
    appliedDate: toDateOnly(record.applied_at),
    hrContact: record.hr_contact ?? "",
    url: record.url ?? "",
    commentary: record.commentary ?? "",
  };
}

/**
 * Payload for `POST /job_apps`. The create contract rejects empty strings for
 * optional fields (`.filled`), so blank values are omitted rather than sent as
 * "". Create also ignores `current_stage` — the server defaults to "applied",
 * which matches the UI (new jobs always start in "Applied").
 */
export function toCreatePayload(job: Job): Record<string, string> {
  const payload: Record<string, string> = {
    company: job.company,
    position: job.title,
    applied_at: job.appliedDate,
  };
  if (job.url !== "") payload.url = job.url;
  if (job.hrContact !== "") payload.hr_contact = job.hrContact;
  if (job.commentary !== "") payload.commentary = job.commentary;
  return payload;
}

/**
 * Payload for `PATCH /job_apps/:id`. The update contract requires the full
 * record (`company/position/applied_at` even for a stage-only change); blank
 * optionals are omitted.
 */
export function toUpdatePayload(job: Job): Record<string, string | number> {
  const payload: Record<string, string | number> = {
    id: Number(job.id),
    company: job.company,
    position: job.title,
    applied_at: job.appliedDate,
    current_stage: STAGE_TO_API[job.stage],
  };
  if (job.url !== "") payload.url = job.url;
  if (job.hrContact !== "") payload.hr_contact = job.hrContact;
  if (job.commentary !== "") payload.commentary = job.commentary;
  return payload;
}

/**
 * Fetches one page of the job list from the API, mapped to frontend Jobs.
 * With a `stageFilter` (anything but "all"), only applications in that stage
 * are returned — pagination then runs over the filtered set server-side.
 */
export async function fetchJobsPage(
  page: number,
  stageFilter?: StageFilter
): Promise<{ jobs: Job[]; meta: PaginateMeta }> {
  const params = new URLSearchParams({
    "paginate[limit]": String(PAGE_SIZE),
    "paginate[page]": String(page),
  });
  if (stageFilter !== undefined && stageFilter !== "all") {
    params.set("filter[current_stage]", STAGE_TO_API[stageFilter]);
  }
  const body = await request<ListResponse>(`/job_apps?${params.toString()}`);
  return { jobs: body.data.map(toJob), meta: body.meta.paginate };
}

/** Aggregated stage counts across all applications (GET /job_apps/stats). */
export interface JobStats {
  total: number;
  applied: number;
  interviewing: number;
  offer: number;
  ghosted: number;
  rejected: number;
}

/** Fetches server-side application stats (covers all pages, not just loaded ones). */
export function fetchStats(): Promise<JobStats> {
  return request<{ data: JobStats }>("/job_apps/stats").then((body) => body.data);
}

/** Creates a job via the API and returns the server-persisted version. */
export async function createJob(job: Job): Promise<Job> {
  const body = await request<{ data: JobRecord }>("/job_apps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toCreatePayload(job)),
  });
  return toJob(body.data);
}

/** Updates a job via the API (full record) and returns the saved version. */
export async function updateJob(job: Job): Promise<Job> {
  const body = await request<{ data: JobRecord }>(
    `/job_apps/${encodeURIComponent(job.id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toUpdatePayload(job)),
    }
  );
  return toJob(body.data);
}

export interface User {
  id: number;
  name: string | null;
  email: string | null;
}

/** Fetches the signed-in user's profile (used by the header). */
export async function fetchUser(): Promise<User> {
  const body = await request<{ data: User }>("/user");
  return body.data;
}

/** The backend's token block on auth responses (`meta.token`). */
export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthMeta {
  token: AuthToken;
}

/** Creates an account via POST /user and returns the user plus issued token. */
export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: User; token: AuthToken }> {
  const body = await request<{ data: User; meta: AuthMeta }>("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return { user: body.data, token: body.meta.token };
}

/**
 * Signs in via POST /sign_in and returns the issued token. Uses apiFetch
 * directly (not request()) so a 401 from wrong credentials doesn't trip the
 * global "session expired" flag — there is no session to expire yet.
 */
export async function signIn(email: string, password: string): Promise<AuthToken> {
  let res: Response;
  try {
    res = await apiFetch("/sign_in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    // The backend answers 401 for both unknown emails and wrong passwords,
    // so a single message keeps accounts from being probed.
    throw new Error("Invalid email or password.");
  }
  const body = (await res.json()) as { meta: AuthMeta };
  return body.meta.token;
}
