"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, getEvents } from "@/lib/api";
import type { EventPage } from "@/types/events";
import { EventTable } from "@/components/event-table";

export function EventBrowser({ overview = false }: { overview?: boolean }) {
  const pageSize = overview ? 6 : 25;
  const [page, setPage] = useState<EventPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventType, setEventType] = useState("");
  const [severity, setSeverity] = useState("");
  const [source, setSource] = useState("");
  const [activeFilters, setActiveFilters] = useState({ eventType: "", severity: "", source: "" });
  const [offset, setOffset] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
    if (activeFilters.eventType) params.set("event_type", activeFilters.eventType);
    if (activeFilters.severity) params.set("severity", activeFilters.severity);
    if (activeFilters.source) params.set("source", activeFilters.source);
    void getEvents(params)
      .then((result) => {
        if (isCurrent) setPage(result);
      })
      .catch((cause: unknown) => {
        if (isCurrent) {
          setError(cause instanceof ApiError ? cause.message : "Unable to load events.");
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [activeFilters, offset, pageSize, reloadKey]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setActiveFilters({ eventType: eventType.trim(), severity, source: source.trim() });
    setOffset(0);
    setReloadKey((key) => key + 1);
  }

  function changeOffset(nextOffset: number) {
    setLoading(true);
    setError(null);
    setOffset(nextOffset);
  }

  function retry() {
    setLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }

  return (
    <section className="panel overflow-hidden">
      {!overview && <form onSubmit={applyFilters} className="grid gap-3 border-b border-[var(--line)] p-4 sm:grid-cols-2 xl:grid-cols-[1fr_180px_1fr_auto]">
        <label className="sr-only" htmlFor="event-type">Filter by event type</label><input id="event-type" className="field" value={eventType} onChange={(event) => setEventType(event.target.value)} placeholder="Event type" />
        <label className="sr-only" htmlFor="severity">Filter by severity</label><select id="severity" className="field" value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="">Any severity</option><option>critical</option><option>high</option><option>medium</option><option>low</option><option>informational</option></select>
        <label className="sr-only" htmlFor="source">Filter by source</label><input id="source" className="field" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Source" />
        <button className="rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200" type="submit">Apply</button>
      </form>}
      {loading ? <div className="px-6 py-14 text-center text-sm text-slate-400" role="status">Loading events…</div> : error ? <div className="px-6 py-12 text-center" role="alert"><p className="font-medium">Events could not be loaded</p><p className="muted mt-2 text-sm">{error}</p><button onClick={retry} className="mt-4 rounded-lg border border-[var(--line)] px-4 py-2 text-sm hover:bg-white/5">Retry</button></div> : <EventTable events={page?.items ?? []} />}
      {!loading && !error && page && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3 text-sm"><span className="muted">{page.total} persisted event{page.total === 1 ? "" : "s"}</span>{overview ? <Link href="/events" className="text-teal-200 hover:text-teal-100">Open event explorer →</Link> : <div className="flex items-center gap-2"><button className="rounded-md border border-[var(--line)] px-3 py-1.5 disabled:opacity-40" disabled={offset === 0} onClick={() => changeOffset(Math.max(0, offset - pageSize))}>Previous</button><span className="muted px-1">{page.total === 0 ? 0 : offset + 1}–{Math.min(offset + page.items.length, page.total)}</span><button className="rounded-md border border-[var(--line)] px-3 py-1.5 disabled:opacity-40" disabled={offset + pageSize >= page.total} onClick={() => changeOffset(offset + pageSize)}>Next</button></div>}</div>}
    </section>
  );
}
