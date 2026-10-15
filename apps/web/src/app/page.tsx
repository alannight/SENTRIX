import { EventBrowser } from "@/components/event-browser";
import { OverviewStats } from "@/components/overview-stats";

export default function OverviewPage() {
  return <div className="mx-auto max-w-7xl space-y-8">
    <header><p className="eyebrow">Investigation workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Overview</h1><p className="muted mt-2 max-w-2xl text-sm leading-6">A traceable view of submitted security events. Counts below come from persisted API records; no correlations or incident conclusions are generated.</p></header>
    <OverviewStats />
    <section className="space-y-3"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Event stream</p><h2 className="mt-1 text-xl font-semibold">Recent events</h2></div></div><EventBrowser overview /></section>
  </div>;
}

