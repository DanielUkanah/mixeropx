"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore, CATEGORIES, CAT_ICON, CAT_COLOR, uid, FileMeta, Expense } from "@/lib/store";
import { naira, pounds, niceDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { putFile, delFile, shrink } from "@/lib/files";
import { ReceiptPicker, ReceiptViewer } from "@/components/Receipts";
import Icon from "@/components/icons";

function Page() {
  const { data, month, rate, cur, conv, fmt, addExpense, removeExpense } = useStore();
  const [open, setOpen] = useState(useSearchParams().get("new") === "1");
  const [type, setType] = useState("All");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [site, setSite] = useState("");
  const [amount, setAmount] = useState("");
  const [litres, setLitres] = useState("");
  const [pending, setPending] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<FileMeta[] | null>(null);

  const val = (e: Expense) => conv(e.amount, e.rate);
  const all = data.expenses.filter((e) => e.date.startsWith(month));
  const list = all.filter((e) => type === "All" || e.category === type).sort((a, b) => b.date.localeCompare(a.date));
  const total = list.reduce((s, e) => s + val(e), 0);
  const litresTot = list.reduce((s, e) => s + (e.litres || 0), 0);
  const fuelCost = list.filter((e) => e.litres).reduce((s, e) => s + val(e), 0);
  const biggest = CATEGORIES.map((c) => ({ c, v: all.filter((e) => e.category === c).reduce((s, e) => s + val(e), 0) })).sort((a, b) => b.v - a.v)[0];

   const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    const files: FileMeta[] = [];
    let failed = 0;
    for (const f of pending) {
      try {
        const blob = await shrink(f);
        const id = uid();
        await putFile(id, { name: f.name, type: blob.type || f.type, blob });
        files.push({ id, name: f.name, type: blob.type || f.type });
      } catch {
        failed++;
      }
    }
    if (failed) alert(`${failed} file${failed > 1 ? "s" : ""} couldn't be saved (PDFs must be under about 700 KB). The expense itself was saved.`);
    addExpense({ date, category, note, site, amount: Number(amount), litres: category === "Fuel" && litres ? Number(litres) : undefined, files });
    setNote(""); setAmount(""); setLitres(""); setPending([]); setBusy(false); setOpen(false);
  };

  const exportCsv = () =>
    downloadCsv(`expenses-${month}.csv`, [
      ["Date", "Type", "Note", "Site", "Litres", "Amount (NGN)", "Rate (NGN per £1)", "Amount (GBP)", "Receipts"],
      ...list.map((e) => [e.date, e.category, e.note, e.site, e.litres ?? "", e.amount, e.rate, (e.amount / e.rate).toFixed(2), e.files.length]),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[28px] font-semibold tracking-tight">Expenses</h1>
        <div className="flex gap-2">
          <button className="btn-quiet gap-2" onClick={exportCsv}><Icon name="download" size={15} /> Export CSV</button>
          <button className="btn" onClick={() => setOpen(!open)}>{open ? "Close form" : "Add expense"}</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel !p-5">
          <p className="text-sm text-ink/55">{type === "All" ? "Spent this month" : `${type} this month`}</p>
          <p className="tnum mt-1 text-2xl font-semibold">{fmt(total)}</p>
        </div>
        <div className="panel !p-5">
          <p className="text-sm text-ink/55">Entries</p>
          <p className="tnum mt-1 text-2xl font-semibold">{list.length}</p>
        </div>
        {type === "Fuel" ? (
          <div className="panel !p-5">
            <p className="text-sm text-ink/55">Diesel bought</p>
            <p className="tnum mt-1 text-2xl font-semibold">{litresTot.toLocaleString()} L</p>
            {litresTot > 0 && <p className="text-xs text-ink/50">about {fmt(fuelCost / litresTot)} a litre</p>}
          </div>
        ) : (
          <div className="panel !p-5">
            <p className="text-sm text-ink/55">Biggest cost</p>
            <p className="mt-1 text-2xl font-semibold">{biggest && biggest.v > 0 ? biggest.c : "None yet"}</p>
          </div>
        )}
      </div>

      {open && (
        <form onSubmit={save} className="panel grid gap-4 md:grid-cols-6">
          <div><label className="label" htmlFor="d">Date</label><input id="d" type="date" required className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="label" htmlFor="c">Type</label><select id="c" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="md:col-span-2"><label className="label" htmlFor="n">What was it for?</label><input id="n" className="input" placeholder="e.g. Diesel, 120 litres" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div><label className="label" htmlFor="s">Site</label><input id="s" className="input" value={site} onChange={(e) => setSite(e.target.value)} /></div>
          <div>
            <label className="label" htmlFor="a">Amount (₦)</label>
            <input id="a" type="number" min={1} required className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {cur === "GBP" && Number(amount) > 0 && <p className="mt-1 text-xs text-ink/50">about {pounds(Number(amount) / rate)} today</p>}
          </div>
          {category === "Fuel" && (
            <div className="md:col-span-2"><label className="label" htmlFor="l">Litres (optional)</label><input id="l" type="number" min={0} step="0.1" className="input" value={litres} onChange={(e) => setLitres(e.target.value)} /></div>
          )}
          <div className={category === "Fuel" ? "md:col-span-4" : "md:col-span-6"}><ReceiptPicker files={pending} onChange={setPending} /></div>
          <div className="text-right md:col-span-6"><button className="btn-accent" disabled={busy}>{busy ? "Saving…" : "Save expense"}</button></div>
        </form>
      )}

      <section className="panel !p-0 overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-ink/8 p-3">
          {["All", ...CATEGORIES].map((c) => {
            const n = c === "All" ? all.length : all.filter((e) => e.category === c).length;
            return (
              <button key={c} onClick={() => setType(c)} className={`tab ${type === c ? "tab-on" : ""}`}>
                {c}
                {n > 0 && <span className="ml-1.5 text-xs opacity-60">{n}</span>}
              </button>
            );
          })}
        </div>
        {list.length === 0 && <p className="p-6 text-sm text-ink/50">No expenses here yet.</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-ink/8">
              {list.map((e) => {
                const col = CAT_COLOR[e.category] ?? "#64748b";
                return (
                  <tr key={e.id}>
                    <td className="py-4 pl-6 pr-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: col + "1f", color: col }}>
                        <Icon name={CAT_ICON[e.category] ?? "dots"} size={18} />
                      </span>
                    </td>
                    <td className="py-4 pr-3">
                      <p className="font-medium">{e.note || e.category}</p>
                      <p className="text-xs text-ink/50">
                        {e.category} · {niceDate(e.date)}
                        {e.site ? ` · ${e.site}` : ""}
                        {e.litres ? ` · ${e.litres} L` : ""}
                      </p>
                    </td>
                    <td className="py-4 pr-3">
                      {e.files.length > 0 && (
                        <button className="chip hover:bg-ink/10" onClick={() => setViewing(e.files)} aria-label="View receipts">
                          <Icon name="paperclip" size={13} />
                          {e.files.length}
                        </button>
                      )}
                    </td>
                    <td className="tnum whitespace-nowrap py-4 pr-3 text-right">
                      <p className="font-semibold">{fmt(val(e))}</p>
                      {cur === "GBP" && <p className="text-xs text-ink/45">{naira(e.amount)} at ₦{e.rate.toLocaleString()}</p>}
                    </td>
                    <td className="py-4 pr-6 text-right">
                      <button
                        className="text-ink/35 hover:text-hivis"
                        onClick={() => {
                          if (confirm("Delete this expense?")) {
                            e.files.forEach((f) => delFile(f.id).catch(() => {}));
                            removeExpense(e.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {viewing && <ReceiptViewer files={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

export default function Expenses() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
