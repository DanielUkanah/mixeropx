"use client";
import Link from "next/link";
import { useStore, CAT_COLOR } from "@/lib/store";
import { monthLabel, shiftMonth, daysAgo } from "@/lib/format";
import { monthStats } from "@/lib/calc";
import { downloadCsv } from "@/lib/csv";
import { BRAND } from "@/lib/brand";
import Icon from "@/components/icons";

function Delta({ now, before, upGood }: { now: number; before: number; upGood: boolean }) {
  if (!before) return null;
  const pct = ((now - before) / Math.abs(before)) * 100;
  const good = pct >= 0 === upGood;
  return (
    <p className={`mt-1 text-xs font-medium ${good ? "text-ok" : "text-hivis-dark"}`}>
      {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}% vs last month
    </p>
  );
}

export default function Reports() {
  const { data, month, ready, rate, cur, conv, fmt, worth } = useStore();
  if (!ready) return null;

  const s = monthStats(data, month, conv);
  const prevMonth = shiftMonth(month, -1);
  const p = monthStats(data, prevMonth, conv);
  const hasPrev = p.moneyIn > 0 || p.moneyOut > 0;
  const margin = s.moneyIn > 0 ? (s.left / s.moneyIn) * 100 : null;

  const open = data.invoices.filter((i) => !i.paidOn);
  const bands: { l: string; f: (d: number) => boolean }[] = [
    { l: "0–14 days", f: (d) => d <= 14 },
    { l: "15–30 days", f: (d) => d > 14 && d <= 30 },
    { l: "31–60 days", f: (d) => d > 30 && d <= 60 },
    { l: "Over 60 days", f: (d) => d > 60 },
  ];
  const aging = bands.map((b) => {
    const L = open.filter((i) => b.f(daysAgo(i.date)));
    return { l: b.l, n: L.length, v: L.reduce((a, i) => a + worth(i), 0) };
  });
  const overdue = open.filter((i) => daysAgo(i.date) > 14);

  // Plain-English highlights
  const tips: string[] = [];
  if (s.moneyIn > 0 && margin !== null) {
    tips.push(
      s.left >= 0
        ? `The truck kept ${Math.round(margin)}% of the money that came in this month.`
        : `Costs are higher than money in. The truck is ${fmt(-s.left)} down this month.`
    );
  }
  if (hasPrev && p.moneyIn > 0 && s.moneyIn > 0) {
    const a = ((s.moneyIn - p.moneyIn) / p.moneyIn) * 100;
    tips.push(`Money in is ${a >= 0 ? "up" : "down"} ${Math.abs(a).toFixed(0)}% on ${monthLabel(prevMonth)}.`);
  }
  if (s.byCat[0] && s.moneyOut > 0) {
    tips.push(`${s.byCat[0].c} is the biggest cost, at ${Math.round((s.byCat[0].v / s.moneyOut) * 100)}% of spending.`);
  }
  if (s.litres > 0) tips.push(`Diesel averaged ${fmt(s.perLitre)} a litre across ${s.litres.toLocaleString()} litres.`);
  const bestSite = [...s.sites].sort((a, b) => b.inn - b.out - (a.inn - a.out))[0];
  if (bestSite && bestSite.inn - bestSite.out > 0) {
    tips.push(`${bestSite.s} is the best earning site, ${fmt(bestSite.inn - bestSite.out)} after its own costs.`);
  }
  if (overdue.length) {
    tips.push(
      `${overdue.length} invoice${overdue.length > 1 ? "s are" : " is"} unpaid after two weeks. That is ${fmt(
        overdue.reduce((a, i) => a + worth(i), 0)
      )} still to collect.`
    );
  }
  if (tips.length === 0) tips.push("Add some invoices and expenses and the highlights will show up here.");

  const exportCsv = () => {
    const N = monthStats(data, month, (n) => n);
    const G = monthStats(data, month, (n, r) => n / (r || rate));
    const rows: (string | number)[][] = [
      [`${BRAND.name} report`, monthLabel(month)],
      [],
      ["", "NGN", "GBP"],
      ["Money in", N.moneyIn, G.moneyIn.toFixed(2)],
      ["Money out", N.moneyOut, G.moneyOut.toFixed(2)],
      ["Left over", N.left, G.left.toFixed(2)],
      [],
      ["Costs by type", "NGN", "GBP"],
      ...N.byCat.map((c) => [c.c, c.v, (G.byCat.find((x) => x.c === c.c)?.v ?? 0).toFixed(2)]),
      [],
      ["Site", "In (NGN)", "Out (NGN)", "In (GBP)", "Out (GBP)"],
      ...N.sites.map((x) => {
        const g = G.sites.find((y) => y.s === x.s);
        return [x.s, x.inn, x.out, (g?.inn ?? 0).toFixed(2), (g?.out ?? 0).toFixed(2)];
      }),
    ];
    downloadCsv(`report-${month}.csv`, rows);
  };

  const kpis = [
    { l: "Money in", v: fmt(s.moneyIn), d: <Delta now={s.moneyIn} before={p.moneyIn} upGood /> },
    { l: "Money out", v: fmt(s.moneyOut), d: <Delta now={s.moneyOut} before={p.moneyOut} upGood={false} /> },
    { l: "Left over", v: fmt(s.left), d: <Delta now={s.left} before={p.left} upGood /> },
    { l: "Kept from sales", v: margin === null ? "–" : `${Math.round(margin)}%`, d: null },
  ];

  return (
    <div className="space-y-6">
      <div className="hidden print:block">
        <p className="text-2xl font-semibold">{BRAND.name}</p>
        <p className="text-sm text-ink/60">Report for {monthLabel(month)} · amounts in {cur === "GBP" ? "pounds" : "naira"}</p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Reports</h1>
          <p className="text-ink/55">{monthLabel(month)}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button className="btn-quiet gap-2" onClick={exportCsv}><Icon name="download" size={15} /> Export CSV</button>
          <button className="btn gap-2" onClick={() => window.print()}><Icon name="printer" size={15} /> Save as PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.l} className="panel !p-5">
            <p className="text-sm text-ink/55">{k.l}</p>
            <p className="tnum mt-1 text-2xl font-semibold">{k.v}</p>
            {k.d}
          </div>
        ))}
      </div>

      <section className="panel grad-soft keep-colors">
        <h2 className="mb-3 font-semibold">What stood out</h2>
        <ul className="space-y-2.5 text-sm">
          {tips.map((t, n) => (
            <li key={n} className="flex gap-3">
              <span className="bg-hivis mt-1.5 h-2 w-2 shrink-0 rounded-full" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel">
          <h2 className="mb-5 font-semibold">Costs by type</h2>
          {s.byCat.length === 0 && <p className="text-sm text-ink/50">No expenses this month.</p>}
          <ul className="space-y-4">
            {s.byCat.map((c) => (
              <li key={c.c}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{c.c} <span className="text-ink/45">· {Math.round((c.v / s.moneyOut) * 100)}%</span></span>
                  <span className="tnum font-medium">{fmt(c.v)}</span>
                </div>
                <div className="h-2 rounded-full bg-ink/8">
                  <div className="keep-colors h-2 rounded-full" style={{ width: `${(c.v / s.moneyOut) * 100}%`, background: CAT_COLOR[c.c] ?? "#64748b" }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2 className="mb-1 font-semibold">Money still to collect</h2>
          <p className="mb-4 text-sm text-ink/50">All unpaid invoices, by how old they are.</p>
          <ul className="divide-y divide-ink/8 text-sm">
            {aging.map((a) => (
              <li key={a.l} className="flex items-center justify-between py-3">
                <span>{a.l} <span className="text-ink/45">· {a.n} invoice{a.n === 1 ? "" : "s"}</span></span>
                <span className="tnum font-semibold">{fmt(a.v)}</span>
              </li>
            ))}
          </ul>
          <Link href="/invoices" className="mt-4 inline-block text-sm font-semibold text-hivis print:hidden">Go to invoices</Link>
        </section>

        <section className="panel">
          <h2 className="mb-4 font-semibold">Sites</h2>
          {s.sites.length === 0 && <p className="text-sm text-ink/50">No site activity this month.</p>}
          <ul className="divide-y divide-ink/8 text-sm">
            {s.sites.map((x) => (
              <li key={x.s} className="flex items-center justify-between py-3">
                <span>{x.s}</span>
                <span className="tnum text-right">
                  <span className="font-semibold">{fmt(x.inn - x.out)}</span>
                  <span className="block text-xs text-ink/45">{fmt(x.inn)} in · {fmt(x.out)} out</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2 className="mb-4 font-semibold">Customers who paid</h2>
          {s.customers.length === 0 && <p className="text-sm text-ink/50">No payments this month.</p>}
          <ul className="divide-y divide-ink/8 text-sm">
            {s.customers.map((c) => (
              <li key={c.name} className="flex items-center justify-between py-3">
                <span>{c.name}</span>
                <span className="tnum font-semibold">{fmt(c.v)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
