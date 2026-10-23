"use client";
import Link from "next/link";
import { useStore, CATEGORIES, CAT_COLOR } from "@/lib/store";
import { monthLabel, shortDate, daysAgo, shiftMonth } from "@/lib/format";
import { monthStats } from "@/lib/calc";
import DailyChart from "@/components/Chart";
import Donut from "@/components/Donut";
import Icon from "@/components/icons";

export default function Overview() {
  const { data, month, ready, rate, cur, conv, fmt, worth } = useStore();
  if (!ready) return null;

  const s = monthStats(data, month, conv);
  const p = monthStats(data, shiftMonth(month, -1), conv);
  const hasPrev = p.moneyIn > 0 || p.moneyOut > 0;
  const diff = s.left - p.left;
  const owed = data.invoices.filter((i) => !i.paidOn).reduce((a, i) => a + worth(i), 0);

  const activity = [
    ...s.invoices.map((i) => ({ date: i.date, text: `Invoiced ${i.customer}`, sub: i.number, amt: worth(i), kind: "bill" as const })),
    ...s.paid.map((i) => ({ date: i.paidOn!, text: `${i.customer} paid`, sub: i.number, amt: s.worthIn(i), kind: "in" as const })),
    ...s.expenses.map((e) => ({ date: e.date, text: e.note || e.category, sub: e.category, amt: conv(e.amount, e.rate), kind: "out" as const })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  // things the owner should look at
  const overdue = data.invoices.filter((i) => !i.paidOn && daysAgo(i.date) > 14);
  const big = s.expenses.filter((e) => data.bigExpense > 0 && e.amount >= data.bigExpense);
  const over = s.byCat.filter((c) => (data.budgets[c.c] || 0) > 0 && c.naira > data.budgets[c.c]);
  const alerts: { text: string; href: string }[] = [];
  if (overdue.length) {
    alerts.push({
      text: `${overdue.length} invoice${overdue.length > 1 ? "s" : ""} unpaid for over two weeks, ${fmt(overdue.reduce((a, i) => a + worth(i), 0))} waiting`,
      href: "/invoices",
    });
  }
  big.forEach((e) => alerts.push({ text: `Large cost: ${e.note || e.category}, ${fmt(conv(e.amount, e.rate))}`, href: "/expenses" }));
  over.forEach((c) => alerts.push({ text: `${c.c} is over its monthly budget`, href: "/settings" }));

  const budgeted = CATEGORIES.filter((c) => (data.budgets[c] || 0) > 0);

  const rows = [
    { l: "Money in", v: s.moneyIn, c: "#5fd39a" },
    { l: "Money out", v: s.moneyOut, c: "#ff9a5b" },
    { l: "Still owed by customers", v: owed, c: "#ffffff" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-ink/55">{monthLabel(month)} · amounts in {cur === "GBP" ? "pounds" : "naira"}</p>
      </div>

      <section className="grad-hero keep-colors grid gap-8 rounded-2xl p-6 text-white ring-1 ring-white/10 md:grid-cols-5 md:p-8">
        <div className="md:col-span-2">
          <p className="text-sm text-white/65">Left over after costs</p>
          <p className={`tnum mt-2 text-[44px] font-bold leading-none tracking-tight ${s.left < 0 ? "text-amber-glow" : ""}`}>{fmt(s.left)}</p>
          {hasPrev && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-white/70">
              <Icon name={diff >= 0 ? "arrowUp" : "arrowDown"} size={14} />
              {fmt(Math.abs(diff))} {diff >= 0 ? "better" : "worse"} than last month
            </p>
          )}
          {cur === "GBP" && <p className="mt-2 text-xs text-white/50">Pounds use the rate from the day each payment or cost was recorded.</p>}

          <dl className="mt-7 space-y-3.5 text-sm">
            {rows.map((r) => (
              <div key={r.l} className="flex items-center justify-between border-t border-white/10 pt-3.5">
                <dt className="flex items-center gap-2.5 text-white/70">
                  <span className="h-2 w-2 rounded-sm" style={{ background: r.c }} />
                  {r.l}
                </dt>
                <dd className="tnum font-semibold">{fmt(r.v)}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 flex flex-wrap gap-2">
            <Link href="/invoices?new=1" className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-[#12181d] hover:bg-white/90">New invoice</Link>
            <Link href="/expenses?new=1" className="rounded-lg bg-white/12 px-3.5 py-2 text-sm font-medium hover:bg-white/20">Add expense</Link>
            <Link href="/reports" className="rounded-lg bg-white/12 px-3.5 py-2 text-sm font-medium hover:bg-white/20">Reports</Link>
          </div>
        </div>
        <div className="md:col-span-3">
          <p className="mb-3 text-sm text-white/65">Day by day</p>
          <DailyChart days={s.days} fmt={fmt} />
        </div>
      </section>

      {alerts.length > 0 && (
        <section>
          <h2 className="mb-2.5 text-sm font-semibold text-ink/70">Needs attention</h2>
          <ul className="space-y-2 text-sm">
            {alerts.map((a, n) => (
              <li key={n}>
                <Link href={a.href} className="flex items-center justify-between gap-3 rounded-r-lg border-l-[3px] border-hivis bg-hivis-soft px-4 py-2.5 hover:brightness-95">
                  <span>{a.text}</span>
                  <Icon name="right" size={14} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-5">
        <section className="panel md:col-span-3">
          <h2 className="mb-4 font-semibold">Recent activity</h2>
          {activity.length === 0 && (
            <p className="text-sm text-ink/50">Nothing yet this month. <Link href="/invoices?new=1" className="font-medium underline">Create the first invoice</Link></p>
          )}
          <ul className="divide-y divide-ink/10">
            {activity.map((a, n) => (
              <li key={n} className="flex items-baseline gap-4 py-3">
                <span className="w-12 shrink-0 text-xs text-ink/45">{shortDate(a.date)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.text}</p>
                  <p className="text-xs text-ink/50">{a.sub}</p>
                </div>
                <p className={`tnum text-sm font-semibold ${a.kind === "in" ? "text-ok" : a.kind === "bill" ? "text-ink/55" : ""}`}>
                  {a.kind === "in" ? "+" : a.kind === "out" ? "−" : ""}{fmt(a.amt)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6 md:col-span-2">
          <section className="panel">
            <h2 className="mb-4 font-semibold">Where the money went</h2>
            {s.byCat.length === 0 ? (
              <p className="text-sm text-ink/50">No expenses this month.</p>
            ) : (
              <>
                <Donut parts={s.byCat.map((c) => ({ label: c.c, value: c.v, color: CAT_COLOR[c.c] ?? "#64748b" }))} center={fmt(s.moneyOut)} sub="spent" />
                <ul className="mt-5 space-y-2 text-sm">
                  {s.byCat.map((c) => (
                    <li key={c.c} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CAT_COLOR[c.c] ?? "#64748b" }} />
                        {c.c}
                      </span>
                      <span className="tnum font-medium">{fmt(c.v)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="panel">
            <h2 className="mb-4 font-semibold">Budgets</h2>
            {budgeted.length === 0 && (
              <p className="text-sm text-ink/50">No budgets set. <Link href="/settings" className="font-medium underline">Add some in Settings</Link></p>
            )}
            <ul className="space-y-4">
              {budgeted.map((c) => {
                const row = s.byCat.find((x) => x.c === c);
                const pct = ((row?.naira ?? 0) / data.budgets[c]) * 100;
                const bg =
                  pct < 80
                    ? "linear-gradient(90deg,#1fa86b,#5fd39a)"
                    : pct < 100
                    ? "linear-gradient(90deg,#e4590f,#ffb27a)"
                    : "linear-gradient(90deg,#e8366d,#ff7a2f)";
                return (
                  <li key={c}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span>{c}</span>
                      <span className="tnum text-ink/60">{fmt(row?.v ?? 0)} of {fmt(conv(data.budgets[c], rate))}</span>
                    </div>
                    <div className="h-2 rounded-full bg-ink/10">
                      <div className="keep-colors h-2 rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: bg }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="panel">
            <h2 className="mb-3 font-semibold">Sites</h2>
            {s.sites.length === 0 && <p className="text-sm text-ink/50">Sites appear once you name one on an invoice or expense.</p>}
            <ul className="divide-y divide-ink/10 text-sm">
              {s.sites.map((x) => (
                <li key={x.s} className="flex items-center justify-between py-2.5">
                  <span>{x.s}</span>
                  <span className="tnum text-right"><span className="text-ok">{fmt(x.inn)}</span><span className="text-ink/45"> in · {fmt(x.out)} out</span></span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
