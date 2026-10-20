import { EventBrowser } from "@/components/event-browser";
import { OverviewStats } from "@/components/overview-stats";

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <header className="space-y-2">
        <p className="eyebrow">Investigation workspace</p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Overview
        </h1>
        <p className="text-sm max-w-2xl leading-relaxed" style={{ color: "var(--muted)" }}>
          A traceable view of submitted security events. Counts below come from persisted API
          records — no correlations or incident conclusions are generated.
        </p>
      </header>

      <OverviewStats />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Event stream</p>
            <h2 className="mt-1.5 text-xl font-bold" style={{ color: "var(--text)" }}>
              Recent events
            </h2>
          </div>
        </div>
        <EventBrowser overview />
      </section>
    </div>
  );
}
