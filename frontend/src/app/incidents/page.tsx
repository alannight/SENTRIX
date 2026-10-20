export default function IncidentsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <p className="eyebrow">Analyst workflow</p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Incident Management
        </h1>
        <p className="text-sm max-w-2xl leading-relaxed" style={{ color: "var(--muted)" }}>
          Incident grouping depends on validated event relationships and correlation rules.
        </p>
      </header>

      <section
        className="panel p-10 flex flex-col items-center text-center"
        style={{
          background: "linear-gradient(135deg, rgba(246,195,71,0.04) 0%, rgba(13,20,32,1) 60%)",
        }}
      >
        {/* Icon */}
        <div
          className="size-16 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: "rgba(246,195,71,0.08)",
            border: "1px solid rgba(246,195,71,0.25)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: "#f8d272" }}>
            <path d="M14 3L25 23H3L14 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M14 11V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="14" cy="20" r="1" fill="currentColor"/>
          </svg>
        </div>

        {/* Badge */}
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-5"
          style={{
            background: "rgba(246,195,71,0.1)",
            border: "1px solid rgba(246,195,71,0.25)",
            color: "#f8d272",
          }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: "#f8d272", animation: "pulse-dot 2s ease infinite" }}
          />
          Not implemented
        </span>

        <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>
          No incident queue available yet
        </h2>
        <p className="text-sm leading-relaxed max-w-lg" style={{ color: "var(--muted)" }}>
          SENTRIX Foundation MVP stores and displays events. It does not correlate events or
          create incidents, so this page intentionally shows no incident count or generated
          findings.
        </p>

        <div
          className="mt-8 grid sm:grid-cols-3 gap-4 w-full max-w-lg pt-8 border-t border-[var(--line)]"
        >
          {[
            { label: "Event correlation", desc: "Group related events by pattern" },
            { label: "Alert triage",       desc: "Prioritize and assign incidents" },
            { label: "Timeline view",      desc: "Chronological attack chain view" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-4 text-left"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-mid)" }}>
                {item.label}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
