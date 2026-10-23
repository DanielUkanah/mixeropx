"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore, invoiceTotal } from "@/lib/store";
import { naira, niceDate } from "@/lib/format";
import { BRAND } from "@/lib/brand";

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const { data, ready } = useStore();
  const inv = data.invoices.find((i) => i.id === id);
  if (!ready) return null;
  if (!inv) return <p>That invoice doesn&apos;t exist. <Link href="/invoices" className="underline">Back to invoices</Link></p>;

  // Customer-facing, so invoices are always in naira
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/invoices" className="text-sm font-medium text-ink/60 hover:text-ink">← All invoices</Link>
        <button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
      </div>
      <article className="light-scope panel mx-auto text-ink max-w-2xl !p-10 print:rounded-none print:p-0 print:shadow-none print:ring-0">
        <div className="bg-hivis keep-colors mb-8 h-1 rounded-full" />
        <header className="flex items-start justify-between border-b border-ink/10 pb-8">
          <div><p className="text-xl font-semibold">{BRAND.name}</p><p className="mt-1 text-sm text-ink/55">Concrete mixer services</p></div>
          <div className="text-right"><p className="text-sm text-ink/55">Invoice</p><p className="text-xl font-semibold">{inv.number}</p><p className="mt-1 text-sm text-ink/55">{niceDate(inv.date)}</p></div>
        </header>
        <section className="flex justify-between py-8 text-sm">
          <div><p className="text-ink/55">Billed to</p><p className="mt-1 text-base font-semibold">{inv.customer}</p><p>{inv.site}</p></div>
          <span className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${inv.paidOn ? "bg-ok-soft text-ok" : "bg-hivis-soft text-hivis-dark"}`}>{inv.paidOn ? `Paid on ${niceDate(inv.paidOn)}` : "Payment due"}</span>
        </section>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-ink/15 text-left text-ink/55"><th className="py-2 font-medium">Item</th><th className="font-medium">Qty</th><th className="font-medium">Price</th><th className="text-right font-medium">Amount</th></tr></thead>
          <tbody className="tnum">
            {inv.items.map((it, n) => (
              <tr key={n} className="border-b border-ink/8"><td className="py-3">{it.desc}</td><td>{it.qty}</td><td>{naira(it.price)}</td><td className="text-right">{naira(it.qty * it.price)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 flex justify-end"><div className="text-right"><p className="text-sm text-ink/55">Total due</p><p className="tnum text-3xl font-semibold">{naira(invoiceTotal(inv))}</p></div></div>
        <p className="mt-10 text-center text-sm text-ink/45">{BRAND.invoiceFooter}</p>
      </article>
    </div>
  );
}
