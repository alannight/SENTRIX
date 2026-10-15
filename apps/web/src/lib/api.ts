import type { EventPage, SecurityEvent } from "@/types/events";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function getJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  } catch {
    throw new ApiError("SENTRIX API is unreachable. Check the API connection and try again.", 0);
  }
  if (!response.ok) {
    if (response.status === 404) throw new ApiError("The requested event was not found.", 404);
    if (response.status >= 500) throw new ApiError("SENTRIX API is temporarily unavailable.", response.status);
    throw new ApiError("The request could not be completed.", response.status);
  }
  return (await response.json()) as T;
}

export function getEvents(params: URLSearchParams): Promise<EventPage> {
  return getJson<EventPage>(`/events?${params.toString()}`);
}

export function getEvent(eventId: string): Promise<SecurityEvent> {
  return getJson<SecurityEvent>(`/events/${encodeURIComponent(eventId)}`);
}

export type Health = { status: "ok" | "degraded"; database: "available" | "unavailable" };

export function getHealth(): Promise<Health> {
  return getJson<Health>("/health");
}
