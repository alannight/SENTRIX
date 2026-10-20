"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, getEvent } from "@/lib/api";
import type { SecurityEvent } from "@/types/events";

function Field({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-semibold uppercase tracking-wide muted">{label}</dt>
      <dd
        className={`text-sm break-words ${mono ? "mono" : ""}`}
        style={{ color: value ? "var(--text)" : "var(--muted)" }}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      onClick={copy}
      className="btn-ghost text-xs h-7 px-3"
      aria-label="Copy to clipboard"
      title="Copy to clipboard"
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--accent)" }}>
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="4" y="1" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M1 4.5h2M1 4.5v5.5a1 1 0 001 1h5.5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      )}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function EventDetail({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<SecurityEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getEvent(eventId)
      .then(setEvent)
      .catch((cause: unknown) =>
        setError(cause instanceof ApiError ? cause.message : "Unable to load this event."),
      );
  }, [eventId]);

  if (error) {
    return (
      <section className="panel p-8 flex flex-col items-center text-center" role="alert">
        <div
          className="size-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "rgba(255,92,92,0.08)", border: "1px solid rgba(255,92,92,0.2)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "#ff9090" }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 8v5M12 16.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Event unavailable</h2>
        <p className="muted mt-2 text-sm max-w-sm">{error}</p>
        <Link href="/events" className="btn-ghost mt-6 text-sm">
          ← Back to events
        </Link>
      </section>
    );
  }

  if (!event) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="panel p-6 space-y-4">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-7 w-56 rounded" />
          <div className="skeleton h-3 w-72 rounded" />
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-2.5 w-16 rounded" />
                <div className="skeleton h-4 w-28 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-6 space-y-3">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const normalizedJson = JSON.stringify(event.normalized_fields, null, 2);
  const rawJson = JSON.stringify(event.raw_event, null, 2);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back link */}
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-150"
        style={{ color: "var(--muted)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Event Explorer
      </Link>

      {/* Header card */}
      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">Persisted event · schema {event.schema_version}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
              {event.event_type}
            </h2>
            <p className="mono mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
              {event.id}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {event.severity && (
              <span className="severity" data-level={event.severity}>
                {event.severity}
              </span>
            )}
          </div>
        </div>

        <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 xl:grid-cols-3 border-t border-[var(--line)] pt-6">
          <Field label="Source"                value={event.source} />
          <Field label="Event timestamp"       value={event.event_timestamp ? new Date(event.event_timestamp).toLocaleString() : null} />
          <Field label="Observed timestamp"    value={new Date(event.observed_timestamp).toLocaleString()} />
          <Field label="Host"                  value={event.host} mono />
          <Field label="User"                  value={event.user} mono />
          <Field label="Source IP"             value={event.source_ip} mono />
          <Field label="Destination IP"        value={event.destination_ip} mono />
          <Field label="Process"               value={event.process_name} mono />
          <Field label="Parser"                value={`${event.parser_name} ${event.parser_version}`} />
        </dl>
      </section>

      {/* Normalized fields */}
      <section className="panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Normalized fields</h3>
          <CopyButton value={normalizedJson} />
        </div>
        <pre className="code-block" style={{ maxHeight: "360px", overflowY: "auto" }}>
          {normalizedJson}
        </pre>
      </section>

      {/* Raw event */}
      <section className="panel p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Original submitted event</h3>
          <CopyButton value={rawJson} />
        </div>
        <p className="text-xs muted mb-4">
          Stored as JSON. Structure is preserved; original byte formatting is not.
        </p>
        <pre className="code-block" style={{ maxHeight: "480px", overflowY: "auto", color: "#a8d8e8" }}>
          {rawJson}
        </pre>
      </section>
    </div>
  );
}
