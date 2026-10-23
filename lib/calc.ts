import { Data, Invoice, invoiceTotal, CATEGORIES } from "./store";

export type Conv = (n: number, r?: number) => number;
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

// All the month maths in one place so Overview and Reports always agree.
export function monthStats(data: Data, month: string, conv: Conv) {
  const inM = (d: string) => d.startsWith(month);
  const invoices = data.invoices.filter((i) => inM(i.date));
  const expenses = data.expenses.filter((e) => inM(e.date));
  const paid = data.invoices.filter((i) => i.paidOn && inM(i.paidOn));
  const worthIn = (i: Invoice) => conv(invoiceTotal(i), i.paidRate ?? i.rate);
  const cost = (e: { amount: number; rate: number }) => conv(e.amount, e.rate);

  const moneyIn = sum(paid.map(worthIn));
  const moneyOut = sum(expenses.map(cost));

  const [y, m] = month.split("-").map(Number);
  const days = Array.from({ length: new Date(y, m, 0).getDate() }, (_, k) => {
    const key = `${month}-${String(k + 1).padStart(2, "0")}`;
    return {
      day: k + 1,
      inn: sum(paid.filter((i) => i.paidOn === key).map(worthIn)),
      out: sum(expenses.filter((e) => e.date === key).map(cost)),
    };
  });

  const byCat = CATEGORIES.map((c) => {
    const L = expenses.filter((e) => e.category === c);
    return { c, v: sum(L.map(cost)), naira: sum(L.map((e) => e.amount)) };
  })
    .filter((x) => x.naira > 0)
    .sort((a, b) => b.v - a.v);

  const siteNames = Array.from(
    new Set([...invoices.map((i) => i.site), ...paid.map((i) => i.site), ...expenses.map((e) => e.site)].filter(Boolean))
  );
  const sites = siteNames.map((s) => ({
    s,
    inn: sum(paid.filter((i) => i.site === s).map(worthIn)),
    out: sum(expenses.filter((e) => e.site === s).map(cost)),
  }));

  const customers = Array.from(new Set(paid.map((i) => i.customer)))
    .map((name) => ({ name, v: sum(paid.filter((i) => i.customer === name).map(worthIn)) }))
    .sort((a, b) => b.v - a.v);

  const fuel = expenses.filter((e) => e.category === "Fuel" && e.litres);
  const litres = sum(fuel.map((e) => e.litres || 0));
  const perLitre = litres > 0 ? sum(fuel.map(cost)) / litres : 0;

  return { invoices, expenses, paid, worthIn, moneyIn, moneyOut, left: moneyIn - moneyOut, days, byCat, sites, customers, litres, perLitre };
}
