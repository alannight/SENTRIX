import { EventBrowser } from "@/components/event-browser";

export default function EventsPage() {
  return <div className="mx-auto max-w-7xl space-y-7"><header><p className="eyebrow">Telemetry records</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Event explorer</h1><p className="muted mt-2 text-sm">Browse persisted events, inspect normalized fields, and review the original submitted JSON.</p></header><EventBrowser /></div>;
}

