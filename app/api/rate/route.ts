import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Rates by Exchange Rate API (https://www.exchangerate-api.com), free open endpoint, updates daily.
export async function GET() {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/GBP", { next: { revalidate: 3600 } });
    if (!r.ok) throw new Error("bad status");
    const j = await r.json();
    const raw = Number(j?.rates?.NGN);
    if (!raw) throw new Error("no NGN rate");
    return NextResponse.json({ raw, rate: Math.round(raw / 10) * 10 }); // rounded to nearest 10 naira
  } catch {
    return NextResponse.json({ error: "rate unavailable" }, { status: 502 });
  }
}
