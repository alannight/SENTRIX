"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, getEvent } from "@/lib/api";
import type { SecurityEvent } from "@/types/events";

function Field({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="muted text-xs">{label}</dt><dd className="mt-1 break-words text-sm">{value || "Unknown"}</dd></div>;
}

export function EventDetail({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<SecurityEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getEvent(eventId).then(setEvent).catch((cause: unknown) => setError(cause instanceof ApiError ? cause.message : "Unable to load this event.")); }, [eventId]);
  if (error) return <section className="panel p-6" role="alert"><h2 className="font-semibold">Event unavailable</h2><p className="muted mt-2 text-sm">{error}</p><Link href="/events" className="mt-4 inline-block text-sm text-teal-200">← Back to events</Link></section>;
  if (!event) return <p role="status" className="panel p-6 text-sm text-slate-400">Loading event details…</p>;
  return <div className="space-y-5">
    <Link href="/events" className="text-sm text-teal-200 hover:text-teal-100">← Event explorer</Link>
    <section className="panel p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Persisted event · schema {event.schema_version}</p><h2 className="mt-2 text-2xl font-semibold">{event.event_type}</h2><p className="muted mt-1 break-all text-xs">{event.id}</p></div>{event.severity && <span className="severity" data-level={event.severity}>{event.severity}</span>}</div>
      <dl className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3"><Field label="Source" value={event.source}/><Field label="Event timestamp" value={event.event_timestamp ? new Date(event.event_timestamp).toLocaleString() : null}/><Field label="Observed timestamp" value={new Date(event.observed_timestamp).toLocaleString()}/><Field label="Host" value={event.host}/><Field label="User" value={event.user}/><Field label="Source IP" value={event.source_ip}/><Field label="Destination IP" value={event.destination_ip}/><Field label="Process" value={event.process_name}/><Field label="Parser" value={`${event.parser_name} ${event.parser_version}`}/></dl>
    </section>
    <section className="panel p-6"><h3 className="font-semibold">Normalized fields</h3><pre className="mt-3 overflow-x-auto rounded-lg bg-[#090e15] p-4 text-xs leading-6 text-teal-100">{JSON.stringify(event.normalized_fields, null, 2)}</pre></section>
    <section className="panel p-6"><h3 className="font-semibold">Original submitted event</h3><p className="muted mt-1 text-xs">Stored as JSON. Its structure is preserved; original byte formatting is not.</p><pre className="mt-3 max-h-[480px] overflow-auto rounded-lg bg-[#090e15] p-4 text-xs leading-6 text-slate-300">{JSON.stringify(event.raw_event, null, 2)}</pre></section>
  </div>;
}

