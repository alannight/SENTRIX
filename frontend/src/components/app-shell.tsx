"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getHealth, type Health } from "@/lib/api";

const links = [
  {
    href: "/",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.9"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.5"/>
      </svg>
    ),
  },
  {
    href: "/events",
    label: "Event Explorer",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4.5h12M2 8h8M2 11.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/incidents",
    label: "Incidents",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2L14.5 13H1.5L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M8 6.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
      </svg>
    ),
  },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [health, setHealth] = useState<Health | "offline" | "loading">("loading");

  useEffect(() => {
    let mounted = true;
    const check = () =>
      getHealth()
        .then((result) => mounted && setHealth(result))
        .catch(() => mounted && setHealth("offline"));
    void check();
    const timer = window.setInterval(check, 30_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const connected = typeof health === "object" && health.status === "ok";
  const statusColor = connected ? "#34d399" : health === "loading" ? "#fbbf24" : "#f87171";
  const statusLabel = connected ? "API connected" : health === "loading" ? "Checking API…" : "API unavailable";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className="border-b border-[var(--line)] lg:border-b-0 lg:border-r lg:min-h-screen flex flex-col"
        style={{ background: "rgba(6,10,16,0.95)", backdropFilter: "blur(8px)" }}
      >
        {/* Logo */}
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 group" aria-label="SENTRIX home">
            <div
              className="relative size-10 rounded-xl flex items-center justify-center font-black text-base"
              style={{
                background: "linear-gradient(135deg, rgba(79,209,197,0.2) 0%, rgba(79,209,197,0.05) 100%)",
                border: "1px solid rgba(79,209,197,0.3)",
                color: "var(--accent)",
                boxShadow: "0 0 20px rgba(79,209,197,0.12)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L17.5 6V14L10 18L2.5 14V6L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="2.5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <strong
                className="block text-sm font-bold tracking-[0.2em]"
                style={{ color: "var(--text)" }}
              >
                SENTRIX
              </strong>
              <small className="text-[10px] font-medium tracking-[0.15em]" style={{ color: "var(--muted)" }}>
                SECURITY INVESTIGATION
              </small>
            </div>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px" style={{ background: "var(--line)" }} />

        {/* Navigation */}
        <nav aria-label="Main navigation" className="p-4 flex flex-col gap-1 mt-2">
          <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--muted)" }}>
            Navigation
          </p>
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200"
                style={
                  active
                    ? {
                        background: "rgba(79,209,197,0.1)",
                        color: "var(--accent-bright)",
                        borderLeft: "2px solid var(--accent)",
                        paddingLeft: "10px",
                      }
                    : {
                        color: "var(--muted)",
                        borderLeft: "2px solid transparent",
                      }
                }
              >
                <span
                  className="transition-colors duration-200"
                  style={{ color: active ? "var(--accent)" : "var(--muted)" }}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* API Status */}
        <div className="p-6 border-t border-[var(--line)]">
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)" }}
            aria-live="polite"
          >
            <span
              className="size-2 rounded-full flex-shrink-0"
              style={{
                background: statusColor,
                boxShadow: connected ? `0 0 6px ${statusColor}` : "none",
                animation: health === "loading" ? "pulse-dot 1.4s ease infinite" : "none",
              }}
            />
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {statusLabel}
            </span>
          </div>
          <p className="mt-4 text-[11px] leading-5 hidden lg:block" style={{ color: "var(--muted)" }}>
            Foundation MVP · event intake and inspection.
            <br />
            Correlation is not implemented.
          </p>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="min-w-0 p-6 sm:p-8 xl:px-12 xl:py-10 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
