"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore, invoiceTotal, Item, Invoice } from "@/lib/store";
import { naira, pounds, niceDate, daysAgo } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import Icon from "@/components/icons";

const blank = (): Item => ({ desc: "", qty: 1, price: 0 });
const status = (i: Invoice) => (i.paidOn ? "paid" : daysAgo(i.date) > 14 ? "overdue" : "unpaid");
const badge = { paid: "bg-ok-soft text-ok", unpaid: "bg-hivis-soft text-hivis-dark", overdue: "bg-spark/10 text-spark" } as const;

function Page() {
  const { data, month, rate, cur, fmt, worth, addInvoice, setPaid, removeInvoice } = useStore();
  const [open, setOpen] = useState(useSearchParams().get("new") === "1");
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [customer, setCustomer] = useState("");
  const [site, setSite] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<Item[]>([blank()]);
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const inMonth = data.invoices.filter((i) => i.date.startsWith(month));
  const list = inMonth.filter((i) => filter === "all" || (filter === "paid") === !!i.paidOn).slice().reverse();
  const sum = (a: Invoice[]) => a.reduce((s, i) => s + worth(i), 0);

  const patch = (n: number, p: Partial<Item>) => setItems(items.map((it, i) => (i === n ? { ...it, ...p } : it)));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    addInvoice({ customer, site, date, items: items.filter((i) => i.desc && i.qty > 0) });
    setCustomer(""); setSite(""); setItems([blank()]); setOpen(false);
  };
  const exportCsv = () =>
    downloadCsv(`invoices-${month}.csv`, [
      ["Number", "Date", "Customer", "Site", "Total (NGN)", "Status", "Paid on", "Rate used (NGN per £1)", "Total (GBP)"],
      ...inMonth.map((i) => {
        const r = i.paidOn ? i.paidRate ?? i.rate : rate;
        return [i.number, i.date, i.customer, i.site, invoiceTotal(i), status(i), i.paidOn ?? "", r, (invoiceTotal(i) / r).toFixed(2)];
      }),
    ]);

  const stats: [string, number][] = [
    ["Invoiced", sum(inMonth)],
    ["Paid", sum(inMonth.filter((i) => i.paidOn))],
    ["Waiting for payment", sum(inMonth.filter((i) => !i.paidOn))],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[28px] font-semibold tracking-tight">Invoices</h1>
        <div className="flex gap-2">
          <button className="btn-quiet gap-2" onClick={exportCsv}><Icon name="download" size={15} /> Export CSV</button>
          <button className="btn" onClick={() => setOpen(!open)}>{open ? "Close form" : "New invoice"}</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(([l, v]) => (
          <div key={l} className="panel !p-5">
            <p className="text-sm text-ink/55">{l}</p>
            <p className="tnum mt-1 text-2xl font-semibold">{fmt(v)}</p>
          </div>
        ))}
      </div>

      {open && (
        <form onSubmit={save} className="panel space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div><label className="label" htmlFor="c">Customer</label><input id="c" required className="input" value={customer} onChange={(e) => setCustomer(e.target.value)} /></div>
            <div><label className="label" htmlFor="s">Site or address</label><input id="s" className="input" value={site} onChange={(e) => setSite(e.target.value)} /></div>
            <div><label className="label" htmlFor="d">Date</label><input id="d" type="date" required className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="space-y-2.5">
            <p className="label">Items (prices in naira)</p>
            {items.map((it, n) => (
              <div key={n} className="grid grid-cols-12 gap-2">
                <input aria-label="Description" placeholder="e.g. Concrete C25, delivered" className="input col-span-12 md:col-span-6" value={it.desc} onChange={(e) => patch(n, { desc: e.target.value })} />
                <input aria-label="Quantity" type="number" min={0} step="0.5" className="input col-span-4 md:col-span-2" value={it.qty} onChange={(e) => patch(n, { qty: Number(e.target.value) })} />
                <input aria-label="Price each" type="number" min={0} placeholder="Price (₦)" className="input col-span-6 md:col-span-3" value={it.price || ""} onChange={(e) => patch(n, { price: Number(e.target.value) })} />
                <button type="button" aria-label="Remove line" className="col-span-2 text-ink/35 hover:text-hivis md:col-span-1" onClick={() => setItems(items.length > 1 ? items.filter((_, i) => i !== n) : items)}>✕</button>
              </div>
            ))}
            <button type="button" className="text-sm font-semibold text-hivis" onClick={() => setItems([...items, blank()])}>Add another line</button>
          </div>
          <div className="flex items-center justify-between border-t border-ink/8 pt-5">
            <p className="text-sm text-ink/60">
              Total <span className="tnum ml-2 text-xl font-semibold text-ink">{naira(total)}</span>
              {cur === "GBP" && total > 0 && <span className="ml-2 text-xs">about {pounds(total / rate)}</span>}
            </p>
            <button className="btn-accent">Save invoice</button>
          </div>
        </form>
      )}

      <section className="panel !p-0 overflow-hidden">
        <div className="flex gap-1 border-b border-ink/8 p-3">
          {(["all", "unpaid", "paid"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`tab capitalize ${filter === f ? "tab-on" : ""}`}>{f}</button>
          ))}
        </div>
        {list.length === 0 && <p className="p-6 text-sm text-ink/50">No invoices here yet.</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-ink/8">
              {list.map((i) => {
                const st = status(i);
                return (
                  <tr key={i.id}>
                    <td className="py-4 pl-6 pr-3"><Link href={`/invoices/${i.id}`} className="font-semibold hover:underline">{i.number}</Link><div className="text-ink/50">{niceDate(i.date)}</div></td>
                    <td className="py-4 pr-3">{i.customer}<div className="text-ink/50">{i.site}</div></td>
                    <td className="tnum whitespace-nowrap py-4 pr-3 font-semibold">
                      {fmt(worth(i))}
                      {cur === "GBP" && <div className="text-xs font-normal text-ink/45">{naira(invoiceTotal(i))}</div>}
                    </td>
                    <td className="py-4 pr-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badge[st]}`}>{st}</span></td>
                    <td className="space-x-3 whitespace-nowrap py-4 pr-6 text-right">
                      <button className="btn-quiet" onClick={() => setPaid(i.id, !i.paidOn)}>{i.paidOn ? "Mark unpaid" : "Mark paid"}</button>
                      <button className="text-ink/35 hover:text-hivis" onClick={() => confirm(`Delete ${i.number}?`) && removeInvoice(i.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function Invoices() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
