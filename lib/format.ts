export type Cur = "NGN" | "GBP";
const sign = (n: number) => (n < 0 ? "−" : "");

export const naira = (n: number) =>
  sign(n) + "₦" + Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const pounds = (n: number) => {
  const a = Math.abs(n);
  const d = a > 0 && a < 100 ? 2 : 0;
  return sign(n) + "£" + a.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
};

export const fmtCur = (n: number, cur: Cur) => (cur === "GBP" ? pounds(n) : naira(n));

export const niceDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const shortDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const monthLabel = (ym: string) =>
  new Date(ym + "-01T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export function shiftMonth(ym: string, by: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + by, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const daysAgo = (iso: string) => Math.floor((Date.now() - new Date(iso + "T00:00:00").getTime()) / 86400000);

export function ago(iso: string | null) {
  if (!iso) return "never";
  const mins = Math.floor((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
