import Link from "next/link";
import type { SecurityEvent } from "@/types/events";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.valueOf())) return "Invalid";
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateFull(value: string | null): string {
  if (!value) return "Unknown";
  const d = new Date(value);
  return Number.isNaN(d.valueOf()) ? "Invalid" : d.toLocaleString();
}

export function EventTable({ events }: { events: SecurityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div
          className="size-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "rgba(79,209,197,0.07)", border: "1px solid rgba(79,209,197,0.15)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent)" }}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="font-semibold" style={{ color: "var(--text)" }}>No events match these filters</p>
        <p className="muted mt-2 text-xs max-w-xs leading-relaxed">
          Submit an event via the API or adjust your filters to explore available data.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table" style={{ minWidth: "720px" }}>
        <thead>
          <tr>
            <th>Event type</th>
            <th>Severity</th>
            <th>Source</th>
            <th>Occurred</th>
            <th>Entities</th>
            <th style={{ width: "44px" }}></th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, idx) => {
            const entities = [event.host, event.user, event.source_ip].filter(Boolean);
            return (
              <tr
                key={event.id}
                className="group animate-fade-in"
                style={{ animationDelay: `${idx * 0.03}s`, animationFillMode: "both" }}
              >
                {/* Event type + ID */}
                <td>
                  <Link
                    href={`/events/${event.id}`}
                    className="block group/link"
                  >
                    <span
                      className="text-sm font-semibold transition-colors duration-150 group-hover/link:text-[var(--accent)]"
                      style={{ color: "var(--text)" }}
                    >
                      {event.event_type}
                    </span>
                    <span
                      className="block mono mt-0.5 truncate max-w-[200px]"
                      style={{ color: "var(--muted)" }}
                    >
                      {event.id}
                    </span>
                  </Link>
                </td>

                {/* Severity */}
                <td>
                  {event.severity ? (
                    <span className="severity" data-level={event.severity}>
                      {event.severity}
                    </span>
                  ) : (
                    <span className="text-xs muted">—</span>
                  )}
                </td>

                {/* Source */}
                <td>
                  <span className="text-sm" style={{ color: "var(--text-mid)" }}>
                    {event.source ?? "—"}
                  </span>
                </td>

                {/* Timestamp */}
                <td>
                  <span
                    className="text-sm tabular-nums"
                    style={{ color: "var(--text-mid)" }}
                    title={formatDateFull(event.event_timestamp)}
                  >
                    {formatDate(event.event_timestamp)}
                  </span>
                </td>

                {/* Entities */}
                <td>
                  {entities.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {entities.map((e) => (
                        <span
                          key={e}
                          className="mono text-[11px] px-2 py-0.5 rounded-md"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid var(--line)",
                            color: "var(--text-mid)",
                          }}
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs muted">—</span>
                  )}
                </td>

                {/* Arrow */}
                <td>
                  <Link
                    href={`/events/${event.id}`}
                    className="flex items-center justify-center size-8 rounded-lg transition-all duration-150 opacity-0 group-hover:opacity-100"
                    style={{
                      background: "rgba(79,209,197,0.08)",
                      border: "1px solid rgba(79,209,197,0.2)",
                      color: "var(--accent)",
                    }}
                    aria-label={`View event ${event.event_type}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
