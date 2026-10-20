"use client";

import { useEffect, useState } from "react";
import { ApiError, getEvents } from "@/lib/api";
import type { EventPage } from "@/types/events";

const severityLevels = ["critical", "high", "medium", "low", "informational"] as const;

const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
  critical:      { color: "#ff9090", bg: "rgba(255,92,92,0.1)",  label: "Critical" },
  high:          { color: "#ffad85", bg: "rgba(255,138,92,0.1)", label: "High" },
  medium:        { color: "#f8d272", bg: "rgba(246,195,71,0.1)", label: "Medium" },
  low:           { color: "#4fd1c5", bg: "rgba(79,209,197,0.1)", label: "Low" },
  informational: { color: "#93c5fd", bg: "rgba(116,169,245,0.08)", label: "Info" },
};

function SeverityBar({ label, count, max }: { label: string; count: number; max: number }) {
  const cfg = severityConfig[label] ?? { color: "var(--muted)", bg: "rgba(255,255,255,0.05)", label };
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs font-medium text-right shrink-0" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: cfg.color, boxShadow: `0 0 8px ${cfg.color}40` }}
        />
      </div>
      <span className="w-8 text-xs font-semibold tabular-nums" style={{ color: cfg.color }}>
        {count}
      </span>
    </div>
  );
}

export function OverviewStats() {
  const [data, setData] = useState<EventPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "500", offset: "0" });
    void getEvents(params)
      .then(setData)
      .catch((cause: unknown) =>
        setError(cause instanceof ApiError ? cause.message : "Unable to load event summary."),
      );
  }, []);

  if (error) {
    return (
      <div className="panel p-5 flex items-center gap-4" role="alert">
        <div
          className="size-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,92,92,0.1)", border: "1px solid rgba(255,92,92,0.25)" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.5" stroke="#ff9090" strokeWidth="1.5"/>
            <path d="M9 6v3.5M9 12h.01" stroke="#ff9090" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#ff9090" }}>Event summary unavailable</p>
          <p className="text-xs mt-0.5 muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="panel p-5 space-y-3">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-8 w-16 rounded" />
            <div className="skeleton h-2 w-32 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const counts = data.items.reduce<Record<string, number>>((acc, event) => {
    const label = event.severity ?? "unknown";
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const critical = (counts.critical ?? 0) + (counts.high ?? 0);
  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-fade-in">
      {/* Total Events */}
      <article className="panel stat-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide muted">Total Events</p>
          <div
            className="size-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(79,209,197,0.1)", color: "var(--accent)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 4.5V7L8.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <p className="text-4xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          {data.total.toLocaleString()}
        </p>
        <p className="text-xs muted">Persisted in database</p>
      </article>

      {/* Critical / High */}
      <article className="panel stat-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide muted">Critical + High</p>
          <div
            className="size-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,92,92,0.1)", color: "#ff9090" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5L13 12H1L7 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M7 5.5V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="7" cy="10" r="0.7" fill="currentColor"/>
            </svg>
          </div>
        </div>
        <p
          className="text-4xl font-bold tracking-tight"
          style={{ color: critical > 0 ? "#ff9090" : "var(--text)" }}
        >
          {critical}
        </p>
        <p className="text-xs muted">Require immediate attention</p>
      </article>

      {/* Sources */}
      <article className="panel stat-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide muted">Unique Sources</p>
          <div
            className="size-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(116,169,245,0.1)", color: "#93c5fd" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2" fill="currentColor"/>
              <circle cx="2" cy="7" r="1.5" fill="currentColor" fillOpacity="0.6"/>
              <circle cx="12" cy="7" r="1.5" fill="currentColor" fillOpacity="0.6"/>
              <path d="M3.5 7H5M9 7h1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <p className="text-4xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          {new Set(data.items.map((e) => e.source).filter(Boolean)).size}
        </p>
        <p className="text-xs muted">Distinct event sources</p>
      </article>

      {/* Severity Breakdown */}
      <article className="panel stat-card p-5 space-y-3 sm:col-span-2 xl:col-span-1">
        <p className="text-xs font-semibold uppercase tracking-wide muted">Severity Breakdown</p>
        <div className="space-y-2.5 pt-1">
          {severityLevels.map((lvl) =>
            counts[lvl] ? (
              <SeverityBar key={lvl} label={lvl} count={counts[lvl]} max={maxCount} />
            ) : null,
          )}
          {Object.keys(counts).length === 0 && (
            <p className="text-xs muted">No events in sample</p>
          )}
        </div>
      </article>
    </div>
  );
}
