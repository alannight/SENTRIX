"use client";

import { useEffect, useState } from "react";
import { ApiError, getEvents } from "@/lib/api";
import type { EventPage } from "@/types/events";

export function OverviewStats() {
  const [data, setData] = useState<EventPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams({ limit: "100", offset: "0" });
    void getEvents(params).then(setData).catch((cause: unknown) => setError(cause instanceof ApiError ? cause.message : "Unable to load event summary."));
  }, []);

  if (error) return <p role="alert" className="panel p-4 text-sm text-rose-200">Event summary unavailable: {error}</p>;
  if (!data) return <p role="status" className="panel p-4 text-sm text-slate-400">Loading event summary…</p>;
  const counts = data.items.reduce<Record<string, number>>((result, event) => {
    const label = event.severity ?? "unknown";
    result[label] = (result[label] ?? 0) + 1;
    return result;
  }, {});
  const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <article className="panel p-5"><p className="muted text-sm">Persisted events</p><p className="mt-3 text-3xl font-semibold">{data.total.toLocaleString()}</p><p className="muted mt-2 text-xs">Total returned by the API</p></article>
    <article className="panel p-5 sm:col-span-1 xl:col-span-3"><p className="muted text-sm">Severity distribution</p><div className="mt-3 flex flex-wrap gap-2">{entries.length ? entries.map(([label, count]) => <span key={label} className="severity" data-level={label}>{label}: {count}</span>) : <span className="muted text-sm">No severity values in the returned events.</span>}</div><p className="muted mt-3 text-xs">Counts reflect the latest {data.items.length} events returned, not the entire database when more than 100 exist.</p></article>
  </div>;
}

