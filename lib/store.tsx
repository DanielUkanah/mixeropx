"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { Cur, fmtCur } from "./format";

export type Item = { desc: string; qty: number; price: number };
export type FileMeta = { id: string; name: string; type: string };
export type Invoice = {
  id: string; number: string; date: string; customer: string; site: string; items: Item[];
  paidOn: string | null;
  rate: number;             // naira per £1 on the day it was created
  paidRate: number | null;  // naira per £1 on the day it was paid
};
export type Expense = {
  id: string; date: string; category: string; note: string; site: string; amount: number;
  rate: number;             // naira per £1 on the day it was recorded
  litres?: number; files: FileMeta[];
};
export type Prefs = { email: string; daily: boolean; weekly: boolean; overdue: boolean; bigSpend: boolean };
export type Data = {
  invoices: Invoice[]; expenses: Expense[];
  budgets: Record<string, number>; bigExpense: number; prefs: Prefs;
  cur: Cur; rateMode: "live" | "manual"; manualRate: number;
  liveRate: number | null; liveRaw: number | null; liveRateAt: string | null;
};

export const invoiceTotal = (inv: Invoice) => inv.items.reduce((s, i) => s + i.qty * i.price, 0);

export const CATEGORIES: string[] = ["Fuel", "Maintenance", "Driver pay", "Spare parts", "Water", "Site levy", "Insurance", "Admin", "Other"];
export const CAT_ICON: Record<string, string> = {
  Fuel: "fuel", Maintenance: "wrench", "Driver pay": "user", "Spare parts": "box", Water: "drop",
  "Site levy": "flag", Insurance: "shield", Admin: "briefcase", Other: "dots",
};
export const CAT_COLOR: Record<string, string> = {
  Fuel: "#e4590f", Maintenance: "#e8366d", "Driver pay": "#7c3aed", "Spare parts": "#2563eb", Water: "#0d9488",
  "Site levy": "#d97706", Insurance: "#4f46e5", Admin: "#64748b", Other: "#94a3b8",
};

const KEY = "mixeropx-data-v2";
const OLD_KEY = "mixbook-data-v1";
export const FALLBACK_RATE = 2000;
export const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

const ymOf = (off: number) => {
  const t = new Date();
  const x = new Date(t.getFullYear(), t.getMonth() + off, 1);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
};
const dayOf = (off: number, n: number) => `${ymOf(off)}-${String(n).padStart(2, "0")}`;

function blank(): Data {
  return {
    invoices: [], expenses: [], budgets: {}, bigExpense: 200000,
    prefs: { email: "", daily: false, weekly: true, overdue: true, bigSpend: true },
    cur: "NGN", rateMode: "live", manualRate: FALLBACK_RATE, liveRate: null, liveRaw: null, liveRateAt: null,
  };
}

function sample(): Data {
  const inv = (n: number, date: string, customer: string, site: string, items: Item[], paidOn: string | null, rate: number): Invoice => ({
    id: uid(), number: `INV-${String(n).padStart(3, "0")}`, date, customer, site, items, paidOn, rate, paidRate: paidOn ? rate : null,
  });
  const exp = (date: string, category: string, note: string, site: string, amount: number, rate: number, litres?: number): Expense => ({
    id: uid(), date, category, note, site, amount, rate, litres, files: [],
  });
  return {
    ...blank(),
    budgets: { Fuel: 350000, Maintenance: 150000, "Driver pay": 400000 },
    invoices: [
      inv(1, dayOf(-1, 4), "Adeyemi Builders", "Lekki Phase 1", [{ desc: "Concrete C25, delivered", qty: 30, price: 85000 }], dayOf(-1, 8), 1960),
      inv(2, dayOf(-1, 18), "Okafor & Sons", "Ajah", [{ desc: "Concrete C30, delivered", qty: 12, price: 92000 }, { desc: "Pump hire", qty: 1, price: 150000 }], null, 1980),
      inv(3, dayOf(-1, 24), "Bright Homes", "Ikoyi", [{ desc: "Concrete C25, delivered", qty: 18, price: 85000 }], dayOf(-1, 28), 1980),
      inv(4, dayOf(0, 2), "Adeyemi Builders", "Lekki Phase 1", [{ desc: "Concrete C25, delivered", qty: 24, price: 85000 }], dayOf(0, 5), 2000),
      inv(5, dayOf(0, 9), "Okafor & Sons", "Ajah", [{ desc: "Concrete C30, delivered", qty: 10, price: 92000 }, { desc: "Pump hire", qty: 1, price: 150000 }], null, 2000),
    ],
    expenses: [
      exp(dayOf(-1, 3), "Fuel", "Diesel, 140 litres", "Lekki Phase 1", 196000, 1960, 140),
      exp(dayOf(-1, 7), "Driver pay", "Weekly pay", "", 90000, 1960),
      exp(dayOf(-1, 12), "Maintenance", "Tyre change", "", 210000, 1980),
      exp(dayOf(-1, 20), "Water", "Water for mixing", "Ajah", 40000, 1980),
      exp(dayOf(-1, 25), "Fuel", "Diesel, 110 litres", "Ikoyi", 154000, 1980, 110),
      exp(dayOf(0, 3), "Fuel", "Diesel, 120 litres", "Lekki Phase 1", 180000, 2000, 120),
      exp(dayOf(0, 6), "Driver pay", "Weekly pay", "", 90000, 2000),
      exp(dayOf(0, 7), "Site levy", "Estate access fee", "Lekki Phase 1", 25000, 2000),
      exp(dayOf(0, 10), "Maintenance", "Drum seal", "Ajah", 135000, 2000),
    ],
  };
}

function load(): Data {
  const base = sample();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { ...base, ...s, prefs: { ...base.prefs, ...s.prefs } };
    }
    const old = localStorage.getItem(OLD_KEY); // carry over data from the first version
    if (old) {
      const o = JSON.parse(old);
      const r = o.rate || FALLBACK_RATE;
      return {
        ...base,
        manualRate: r,
        invoices: (o.invoices ?? []).map((i: any) => ({ ...i, rate: r, paidRate: i.paidOn ? r : null })),
        expenses: (o.expenses ?? []).map((e: any) => ({ ...e, category: e.category === "Repairs" ? "Maintenance" : e.category, rate: r, files: [] })),
      };
    }
  } catch {}
  return base;
}

type Store = {
  data: Data; ready: boolean; month: string; setMonth: (m: string) => void;
  rate: number; cur: Cur; setCur: (c: Cur) => void;
  conv: (n: number, r?: number) => number; fmt: (v: number) => string; worth: (i: Invoice) => number;
  addInvoice: (i: Omit<Invoice, "id" | "number" | "paidOn" | "paidRate" | "rate">) => string;
  setPaid: (id: string, paid: boolean) => void; removeInvoice: (id: string) => void;
  addExpense: (e: Omit<Expense, "id" | "rate">) => void; removeExpense: (id: string) => void;
  setBudget: (cat: string, v: number) => void; setBigExpense: (v: number) => void; setPrefs: (p: Partial<Prefs>) => void;
  setRateMode: (m: "live" | "manual") => void; setManualRate: (r: number) => void;
  refreshRate: () => Promise<void>; rateBusy: boolean; clearAll: () => void;
};
const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(blank());
  const [ready, setReady] = useState(false);
  const [month, setMonth] = useState(today().slice(0, 7));
  const [rateBusy, setRateBusy] = useState(false);

  useEffect(() => { setData(load()); setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(data)); }, [data, ready]);

  const refreshRate = useCallback(async () => {
    setRateBusy(true);
    try {
      const r = await fetch("/api/rate");
      if (!r.ok) throw new Error("rate failed");
      const j = await r.json();
      setData((d) => ({ ...d, liveRate: j.rate, liveRaw: j.raw, liveRateAt: new Date().toISOString() }));
    } catch {
      /* keep the last known rate */
    } finally {
      setRateBusy(false);
    }
  }, []);

  // check the live rate on load if it's older than 6 hours
  useEffect(() => {
    if (!ready || data.rateMode !== "live") return;
    const t = data.liveRateAt ? Date.parse(data.liveRateAt) : 0;
    if (Date.now() - t > 6 * 3600e3) refreshRate();
  }, [ready]); // eslint-disable-line

  const rate = data.rateMode === "manual" ? data.manualRate : data.liveRate ?? data.manualRate;
  const cur = data.cur;
  const conv = (n: number, r?: number) => (cur === "GBP" ? n / (r || rate) : n);
  const fmt = (v: number) => fmtCur(v, cur);
  // paid invoices use the rate from the day they were paid, unpaid ones use today's rate
  const worth = (i: Invoice) => conv(invoiceTotal(i), i.paidOn ? (i.paidRate ?? i.rate) : rate);

  const addInvoice: Store["addInvoice"] = (i) => {
    const id = uid();
    setData((d) => {
      const next = Math.max(0, ...d.invoices.map((x) => parseInt(x.number.slice(4)) || 0)) + 1;
      return { ...d, invoices: [...d.invoices, { ...i, id, rate, paidOn: null, paidRate: null, number: `INV-${String(next).padStart(3, "0")}` }] };
    });
    return id;
  };

  const value: Store = {
    data, ready, month, setMonth, rate, cur, conv, fmt, worth, addInvoice, refreshRate, rateBusy,
    setCur: (c) => setData((d) => ({ ...d, cur: c })),
    setPaid: (id, paid) =>
      setData((d) => ({
        ...d,
        invoices: d.invoices.map((x) => (x.id === id ? { ...x, paidOn: paid ? today() : null, paidRate: paid ? rate : null } : x)),
      })),
    removeInvoice: (id) => setData((d) => ({ ...d, invoices: d.invoices.filter((x) => x.id !== id) })),
    addExpense: (e) => setData((d) => ({ ...d, expenses: [...d.expenses, { ...e, id: uid(), rate }] })),
    removeExpense: (id) => setData((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== id) })),
    setBudget: (cat, v) => setData((d) => ({ ...d, budgets: { ...d.budgets, [cat]: v } })),
    setBigExpense: (v) => setData((d) => ({ ...d, bigExpense: v })),
    setPrefs: (p) => setData((d) => ({ ...d, prefs: { ...d.prefs, ...p } })),
    setRateMode: (m) => {
      setData((d) => ({ ...d, rateMode: m }));
      if (m === "live") refreshRate();
    },
    setManualRate: (r) => setData((d) => ({ ...d, manualRate: r })),
    clearAll: () => setData((d) => ({ ...d, invoices: [], expenses: [] })),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
