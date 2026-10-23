"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { monthLabel, shiftMonth, ago, naira } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import Icon from "./icons";

const nav = [
  { href: "/", label: "Overview", icon: "overview" },
  { href: "/invoices", label: "Invoices", icon: "invoices" },
  { href: "/expenses", label: "Expenses", icon: "expenses" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function CurrencyToggle() {
  const { data, setCur } = useStore();
  return (
    <div role="group" aria-label="Show amounts in" className="flex rounded-lg border border-ink/15 bg-surface p-0.5">
      {(["NGN", "GBP"] as const).map((c) => (
        <button
          key={c}
          aria-pressed={data.cur === c}
          onClick={() => setCur(c)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition ${data.cur === c ? "bg-ink text-canvas" : "text-ink/60 hover:text-ink"}`}
        >
          {c === "NGN" ? "₦ Naira" : "£ Pound"}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  const flip = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("mixeropx-theme", next ? "dark" : "light"); } catch {}
  };
  return (
    <button onClick={flip} className="btn-quiet !px-2.5" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Light theme" : "Dark theme"}>
      <Icon name={dark ? "sun" : "moon"} size={17} />
    </button>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { month, setMonth, data, rate } = useStore();
  const isOn = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  const showMonth = !path.startsWith("/settings");

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden border-r border-ink/10 bg-surface/80 backdrop-blur print:hidden md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col md:px-4 md:py-7">
        <Link href="/" className="mb-9 block px-3">
          <span className="block text-lg font-bold leading-none tracking-tight">{BRAND.name}</span>
          <span className="mt-1.5 block text-xs text-ink/50">{BRAND.tagline}</span>
        </Link>
        <nav className="space-y-0.5">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] ${isOn(n.href) ? "bg-ink/8 font-semibold text-ink" : "text-ink/60 hover:bg-ink/5 hover:text-ink"}`}
            >
              <Icon name={n.icon} size={18} /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-ink/10 px-3 pt-4 text-xs text-ink/50">
          <p className="tnum text-sm font-medium text-ink">£1 = {naira(rate)}</p>
          <p className="mt-0.5">
            {data.rateMode === "live" ? `Live, rounded to ₦10${data.liveRateAt ? ` · ${ago(data.liveRateAt)}` : ""}` : "Set by you"}
          </p>
        </div>
      </aside>

      <main className="w-full flex-1 px-4 pb-24 pt-5 md:ml-60 md:px-10 md:pb-12 md:pt-8 print:m-0 print:p-0">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-lg font-bold tracking-tight md:hidden print:hidden">{BRAND.name}</p>
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3 print:hidden">
            {showMonth ? (
              <div className="flex items-center">
                <button aria-label="Previous month" className="rounded-lg p-2 text-ink/60 hover:bg-ink/6 hover:text-ink" onClick={() => setMonth(shiftMonth(month, -1))}><Icon name="left" size={16} /></button>
                <span className="min-w-[9.5rem] text-center text-sm font-semibold">{monthLabel(month)}</span>
                <button aria-label="Next month" className="rounded-lg p-2 text-ink/60 hover:bg-ink/6 hover:text-ink" onClick={() => setMonth(shiftMonth(month, 1))}><Icon name="right" size={16} /></button>
              </div>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <CurrencyToggle />
              <ThemeToggle />
              <Link href="/invoices?new=1" className="btn-accent hidden sm:inline-flex"><Icon name="plus" size={16} /> New invoice</Link>
            </div>
          </div>
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-ink/10 bg-surface/95 backdrop-blur print:hidden md:hidden">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isOn(n.href) ? "text-hivis" : "text-ink/55"}`}>
            <Icon name={n.icon} size={21} /> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
