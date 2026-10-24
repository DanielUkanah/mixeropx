"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut, User } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { Cur, fmtCur } from "./format";
import { fb } from "./firebase";

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
export type Settings = {
  budgets: Record<string, number>; bigExpense: number; prefs: Prefs;
  rateMode: "live" | "manual"; manualRate: number;
  liveRate: number | null; liveRaw: number | null; liveRateAt: string | null;
};
export type Data = Settings & { invoices: Invoice[]; expenses: Expense[]; cur: Cur };

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

export const FALLBACK_RATE = 2000;
export const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

const DEFAULTS: Settings = {
  budgets: {}, bigExpense: 200000,
  prefs: { email: "", daily: false, weekly: true, overdue: true, bigSpend: true },
  rateMode: "live", manualRate: FALLBACK_RATE, liveRate: null, liveRaw: null, liveRateAt: null,
};

const LOCAL_KEY = "mixeropx-data-v2"; // where the browser-only version kept its data
const readLocal = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

type Store = {
  data: Data; ready: boolean; month: string; setMonth: (m: string) => void;
  user: User | null; authReady: boolean; dataError: boolean;
  signIn: (email: string, password: string) => Promise<unknown>; signOut: () => Promise<void>;
  hasLocal: boolean; importLocal: () => Promise<number>;
  rate: number; cur: Cur; setCur: (c: Cur) => void;
  conv: (n: number, r?: number) => number; fmt: (v: number) => string; worth: (i: Invoice) => number;
  addInvoice: (i: Omit<Invoice, "id" | "number" | "paidOn" | "paidRate" | "rate">) => string;
  setPaid: (id: string, paid: boolean) => void; removeInvoice: (id: string) => void;
  addExpense: (e: Omit<Expense, "id" | "rate">) => void; removeExpense: (id: string) => void;
  setBudget: (cat: string, v: number) => void; setBigExpense: (v: number) => void; setPrefs: (p: Partial<Prefs>) => void;
  setRateMode: (m: "live" | "manual") => void; setManualRate: (r: number) => void;
  refreshRate: () => Promise<void>; rateBusy: boolean; clearAll: () => Promise<void>;
};
const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState({ inv: false, exp: false, set: false });
  const [dataError, setDataError] = useState(false);
  const [cur, setCurState] = useState<Cur>("NGN");
  const [month, setMonth] = useState(today().slice(0, 7));
  const [rateBusy, setRateBusy] = useState(false);
  const [hasLocal, setHasLocal] = useState(false);

  // display currency is a personal choice, so it stays on this device
  useEffect(() => {
    try { if (localStorage.getItem("mixeropx-cur") === "GBP") setCurState("GBP"); } catch {}
    const o = readLocal();
    try {
      setHasLocal(!!o && !localStorage.getItem("mixeropx-imported") && ((o.invoices?.length ?? 0) + (o.expenses?.length ?? 0) > 0));
    } catch {}
  }, []);

  // who is signed in
  useEffect(() => {
    const f = fb();
    if (!f) { setAuthReady(true); return; }
    return onAuthStateChanged(f.auth, (u) => { setUser(u); setAuthReady(true); });
  }, []);

  // live data from Firebase
  useEffect(() => {
    const f = fb();
    if (!f || !user) { setLoaded({ inv: false, exp: false, set: false }); return; }
    setDataError(false);
    const fail = (e: unknown) => { console.error(e); setDataError(true); };
    const u1 = onSnapshot(collection(f.db, "invoices"), (s) => {
      const list = s.docs.map((d) => d.data() as Invoice).sort((a, b) => (a.date + a.number).localeCompare(b.date + b.number));
      setInvoices(list);
      setLoaded((l) => ({ ...l, inv: true }));
    }, fail);
    const u2 = onSnapshot(collection(f.db, "expenses"), (s) => {
      setExpenses(s.docs.map((d) => d.data() as Expense));
      setLoaded((l) => ({ ...l, exp: true }));
    }, fail);
    const u3 = onSnapshot(doc(f.db, "settings", "main"), (s) => {
      const v = (s.data() ?? {}) as Partial<Settings>;
      setSettings({ ...DEFAULTS, ...v, prefs: { ...DEFAULTS.prefs, ...(v.prefs ?? {}) }, budgets: v.budgets ?? {} });
      setLoaded((l) => ({ ...l, set: true }));
    }, fail);
    return () => { u1(); u2(); u3(); };
  }, [user]);

  const ready = !!user && loaded.inv && loaded.exp && loaded.set;

  const saveSettings = (p: Record<string, unknown>) => {
    const f = fb();
    if (f) setDoc(doc(f.db, "settings", "main"), p, { merge: true }).catch(console.error);
  };

  const refreshRate = useCallback(async () => {
    setRateBusy(true);
    try {
      const r = await fetch("/api/rate");
      if (!r.ok) throw new Error("rate failed");
      const j = await r.json();
      const f = fb();
      if (f) setDoc(doc(f.db, "settings", "main"), { liveRate: j.rate, liveRaw: j.raw, liveRateAt: new Date().toISOString() }, { merge: true }).catch(console.error);
    } catch {
      /* keep the last known rate */
    } finally {
      setRateBusy(false);
    }
  }, []);

  // check the live rate on load if it's older than 6 hours
  useEffect(() => {
    if (!ready || settings.rateMode !== "live") return;
    const t = settings.liveRateAt ? Date.parse(settings.liveRateAt) : 0;
    if (Date.now() - t > 6 * 3600e3) refreshRate();
  }, [ready]); // eslint-disable-line

  const rate = settings.rateMode === "manual" ? settings.manualRate : settings.liveRate ?? settings.manualRate;
  const conv = (n: number, r?: number) => (cur === "GBP" ? n / (r || rate) : n);
  const fmt = (v: number) => fmtCur(v, cur);
  // paid invoices use the rate from the day they were paid, unpaid ones use today's rate
  const worth = (i: Invoice) => conv(invoiceTotal(i), i.paidOn ? (i.paidRate ?? i.rate) : rate);

  const data: Data = { ...settings, invoices, expenses, cur };

  const addInvoice: Store["addInvoice"] = (i) => {
    const id = uid();
    const next = Math.max(0, ...invoices.map((x) => parseInt(x.number.slice(4)) || 0)) + 1;
    const inv: Invoice = { ...i, id, rate, paidOn: null, paidRate: null, number: `INV-${String(next).padStart(3, "0")}` };
    const f = fb();
    if (f) setDoc(doc(f.db, "invoices", id), inv).catch(console.error);
    return id;
  };

  // writes in batches of 400 (Firestore's limit is 500)
  const batched = async (ops: ((b: ReturnType<typeof writeBatch>) => void)[]) => {
    const f = fb();
    if (!f) return;
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(f.db);
      ops.slice(i, i + 400).forEach((op) => op(b));
      await b.commit();
    }
  };

  const value: Store = {
    data, ready, month, setMonth, user, authReady, dataError, hasLocal, rate, cur, conv, fmt, worth, addInvoice, refreshRate, rateBusy,
    signIn: (email, password) => {
      const f = fb();
      if (!f) return Promise.reject(new Error("Firebase is not connected"));
      return signInWithEmailAndPassword(f.auth, email, password);
    },
    signOut: async () => {
      const f = fb();
      if (f) await fbSignOut(f.auth);
    },
    setCur: (c) => {
      setCurState(c);
      try { localStorage.setItem("mixeropx-cur", c); } catch {}
    },
    setPaid: (id, paid) => {
      const f = fb();
      if (f) updateDoc(doc(f.db, "invoices", id), { paidOn: paid ? today() : null, paidRate: paid ? rate : null }).catch(console.error);
    },
    removeInvoice: (id) => {
      const f = fb();
      if (f) deleteDoc(doc(f.db, "invoices", id)).catch(console.error);
    },
    addExpense: (e) => {
      const f = fb();
      const id = uid();
      if (f) setDoc(doc(f.db, "expenses", id), { ...e, id, rate }).catch(console.error);
    },
    removeExpense: (id) => {
      const f = fb();
      if (f) deleteDoc(doc(f.db, "expenses", id)).catch(console.error);
    },
    setBudget: (cat, v) => saveSettings({ budgets: { [cat]: v } }),
    setBigExpense: (v) => saveSettings({ bigExpense: v }),
    setPrefs: (p) => saveSettings({ prefs: p }),
    setRateMode: (m) => {
      saveSettings({ rateMode: m });
      if (m === "live") refreshRate();
    },
    setManualRate: (r) => saveSettings({ manualRate: r }),
    clearAll: async () => {
      const f = fb();
      if (!f) return;
      await batched([
        ...invoices.map((i) => (b: ReturnType<typeof writeBatch>) => b.delete(doc(f.db, "invoices", i.id))),
        ...expenses.map((e) => (b: ReturnType<typeof writeBatch>) => b.delete(doc(f.db, "expenses", e.id))),
      ]);
    },
    // one-time copy of what this browser saved before Firebase was connected
    importLocal: async () => {
      const f = fb();
      const o = readLocal();
      if (!f || !o) return 0;
      const inv: Invoice[] = o.invoices ?? [];
      const exp: Expense[] = (o.expenses ?? []).map((e: Expense) => ({ ...e, files: [] }));
      await batched([
        ...inv.map((i) => (b: ReturnType<typeof writeBatch>) => b.set(doc(f.db, "invoices", i.id), i)),
        ...exp.map((e) => (b: ReturnType<typeof writeBatch>) => b.set(doc(f.db, "expenses", e.id), e)),
      ]);
      await setDoc(doc(f.db, "settings", "main"), {
        budgets: o.budgets ?? {}, bigExpense: o.bigExpense ?? DEFAULTS.bigExpense, prefs: o.prefs ?? DEFAULTS.prefs, manualRate: o.manualRate ?? FALLBACK_RATE,
      }, { merge: true });
      try { localStorage.setItem("mixeropx-imported", "1"); } catch {}
      setHasLocal(false);
      return inv.length + exp.length;
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}