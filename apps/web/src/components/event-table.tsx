import Link from "next/link";
import type { SecurityEvent } from "@/types/events";

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Invalid timestamp" : date.toLocaleString();
}

export function EventTable({ events }: { events: SecurityEvent[] }) {
  if (events.length === 0) {
    return <div className="px-6 py-14 text-center"><p className="font-medium">No events match these filters</p><p className="muted mt-2 text-sm">Submit an event or adjust the filters to explore available data.</p></div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-[var(--line)] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-medium">Event</th><th className="px-4 py-3 font-medium">Occurred</th><th className="px-4 py-3 font-medium">Severity</th><th className="px-4 py-3 font-medium">Source</th><th className="px-4 py-3 font-medium">Entities</th></tr></thead>
        <tbody className="divide-y divide-[var(--line)]">
          {events.map((event) => <tr key={event.id} className="hover:bg-white/[0.025]"><td className="px-5 py-4"><Link href={`/events/${event.id}`} className="font-medium text-slate-100 hover:text-teal-200">{event.event_type}</Link><p className="muted mt-1 max-w-[260px] truncate text-xs">{event.id}</p></td><td className="px-4 py-4 text-slate-300">{formatDate(event.event_timestamp)}</td><td className="px-4 py-4">{event.severity ? <span className="severity" data-level={event.severity}>{event.severity}</span> : <span className="muted">Unknown</span>}</td><td className="px-4 py-4 text-slate-300">{event.source}</td><td className="px-4 py-4 text-slate-400">{[event.host, event.user, event.source_ip].filter(Boolean).join(" · ") || "—"}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

