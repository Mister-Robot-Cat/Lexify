"use client";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export async function postJson<T = unknown>(url: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? "generic");
  return data as T;
}

/** Picks a translated message for an API error code, with a generic fallback. */
export function errorText(err: unknown, messages: Record<string, string>): string {
  const code = err instanceof ApiError ? err.code : "generic";
  return messages[code] ?? messages.generic;
}
