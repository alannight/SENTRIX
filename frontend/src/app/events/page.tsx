import { EventBrowser } from "@/components/event-browser";

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="space-y-2">
        <p className="eyebrow">Telemetry records</p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Event Explorer
        </h1>
        <p className="text-sm max-w-2xl leading-relaxed" style={{ color: "var(--muted)" }}>
          Browse persisted events, inspect normalized fields, and review the original submitted JSON.
        </p>
      </header>
      <EventBrowser />
    </div>
  );
}
