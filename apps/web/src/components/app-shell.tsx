"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getHealth, type Health } from "@/lib/api";

const links = [
  { href: "/", label: "Overview" },
  { href: "/events", label: "Event explorer" },
  { href: "/incidents", label: "Incidents" },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [health, setHealth] = useState<Health | "offline" | "loading">("loading");

  useEffect(() => {
    let mounted = true;
    const check = () => getHealth().then((result) => mounted && setHealth(result)).catch(() => mounted && setHealth("offline"));
    void check();
    const timer = window.setInterval(check, 30_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  const connected = typeof health === "object" && health.status === "ok";
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[244px_1fr]">
      <aside className="border-b border-[var(--line)] bg-[#0b1018]/90 p-5 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-6">
        <Link href="/" className="flex items-center gap-3" aria-label="SENTRIX home">
          <span className="grid size-10 place-items-center rounded-xl border border-teal-300/30 bg-teal-300/10 text-lg font-bold text-teal-200">S</span>
          <span><strong className="block tracking-[0.18em]">SENTRIX</strong><small className="muted">SECURITY INVESTIGATION</small></span>
        </Link>
        <nav aria-label="Main navigation" className="mt-8 flex gap-2 lg:flex-col">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`rounded-lg px-3 py-2.5 text-sm ${active ? "bg-teal-300/10 text-teal-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`}>{link.label}</Link>;
          })}
        </nav>
        <div className="mt-8 flex items-center gap-2 text-xs" aria-live="polite">
          <span className={`size-2 rounded-full ${connected ? "bg-emerald-400" : health === "loading" ? "bg-amber-300" : "bg-rose-400"}`} />
          <span className="muted">{connected ? "API connected" : health === "loading" ? "Checking API…" : "API unavailable"}</span>
        </div>
        <p className="muted mt-8 hidden text-xs leading-5 lg:block">Foundation MVP · event intake and inspection. Correlation is not implemented.</p>
      </aside>
      <main className="min-w-0 p-5 sm:p-8 xl:px-12">{children}</main>
    </div>
  );
}

