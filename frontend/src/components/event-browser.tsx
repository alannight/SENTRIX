"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, getEvents } from "@/lib/api";
import type { EventPage } from "@/types/events";
import { EventTable } from "@/components/event-table";

const SEVERITY_OPTIONS = ["critical", "high", "medium", "low", "informational"] as const;

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
    setLoading(true);
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
    if (activeFilters.eventType) params.set("event_type", activeFilters.eventType);
    if (activeFilters.severity) params.set("severity", activeFilters.severity);
    if (activeFilters.source) params.set("source", activeFilters.source);
    void getEvents(params)
      .then((result) => { if (isCurrent) { setPage(result); setLoading(false); } })
      .catch((cause: unknown) => {
        if (isCurrent) {
          setError(cause instanceof ApiError ? cause.message : "Unable to load events.");
          setLoading(false);
        }
      });
    return () => { isCurrent = false; };
  }, [activeFilters, offset, pageSize, reloadKey]);

  function applyFilters(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setActiveFilters({ eventType: eventType.trim(), severity, source: source.trim() });
    setOffset(0);
    setReloadKey((k) => k + 1);
  }

  function clearFilters() {
    setEventType("");
    setSeverity("");
    setSource("");
    setError(null);
    setActiveFilters({ eventType: "", severity: "", source: "" });
    setOffset(0);
    setReloadKey((k) => k + 1);
  }

  function changeOffset(next: number) {
    setError(null);
    setOffset(next);
  }

  function retry() {
    setError(null);
    setReloadKey((k) => k + 1);
  }

  const hasActiveFilters = activeFilters.eventType || activeFilters.severity || activeFilters.source;
  const currentPage = page ? Math.floor(offset / pageSize) + 1 : 0;
  const totalPages = page ? Math.ceil(page.total / pageSize) : 0;

  return (
    <section className="panel overflow-hidden">
      {/* Filter Bar */}
      {!overview && (
        <form
          onSubmit={applyFilters}
          className="flex flex-wrap items-end gap-3 p-5 border-b border-[var(--line)]"
          style={{ background: "rgba(6,10,16,0.5)" }}
        >
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 muted" htmlFor="event-type">
              Event type
            </label>
            <input
              id="event-type"
              className="field w-full text-sm"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="e.g. login_failure"
            />
          </div>

          <div className="w-44">
            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 muted" htmlFor="severity">
              Severity
            </label>
            <select
              id="severity"
              className="field w-full text-sm"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="">Any severity</option>
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 muted" htmlFor="source">
              Source
            </label>
            <input
              id="source"
              className="field w-full text-sm"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. firewall"
            />
          </div>

          <div className="flex items-center gap-2 pb-0.5">
            <button type="submit" className="btn-primary">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Apply
            </button>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="btn-ghost">
                Clear
              </button>
            )}
          </div>
        </form>
      )}

      {/* Active filter chips */}
      {!overview && hasActiveFilters && (
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-[var(--line)]" style={{ background: "rgba(79,209,197,0.03)" }}>
          {activeFilters.eventType && (
            <span
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: "rgba(79,209,197,0.1)", border: "1px solid rgba(79,209,197,0.25)", color: "var(--accent)" }}
            >
              type: {activeFilters.eventType}
            </span>
          )}
          {activeFilters.severity && (
            <span className="severity" data-level={activeFilters.severity}>
              {activeFilters.severity}
            </span>
          )}
          {activeFilters.source && (
            <span
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: "rgba(116,169,245,0.1)", border: "1px solid rgba(116,169,245,0.25)", color: "#93c5fd" }}
            >
              source: {activeFilters.source}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-0">
          {[...Array(pageSize > 10 ? 8 : pageSize)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4 border-b border-[var(--line)]"
            >
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-5 w-16 rounded-full ml-4" />
              <div className="skeleton h-4 w-20 rounded ml-auto" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center" role="alert">
          <div
            className="size-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(255,92,92,0.08)", border: "1px solid rgba(255,92,92,0.2)" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: "#ff9090" }}>
              <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 7v4M10 13.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Events could not be loaded</p>
          <p className="muted mt-1.5 text-xs max-w-xs">{error}</p>
          <button onClick={retry} className="btn-ghost mt-5 text-xs">
            Try again
          </button>
        </div>
      ) : (
        <EventTable events={page?.items ?? []} />
      )}

      {/* Pagination Footer */}
      {!loading && !error && page && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--line)]"
          style={{ background: "rgba(6,10,16,0.3)" }}
        >
          <span className="text-xs muted">
            <span className="font-semibold" style={{ color: "var(--text-mid)" }}>
              {page.total.toLocaleString()}
            </span>{" "}
            event{page.total !== 1 ? "s" : ""}
            {hasActiveFilters && " matched"}
          </span>

          {overview ? (
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-150"
              style={{ color: "var(--accent)" }}
            >
              View all in Event Explorer
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <button
                className="btn-ghost text-xs"
                disabled={offset === 0}
                onClick={() => changeOffset(Math.max(0, offset - pageSize))}
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <span className="text-xs muted tabular-nums">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                className="btn-ghost text-xs"
                disabled={offset + pageSize >= page.total}
                onClick={() => changeOffset(offset + pageSize)}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
