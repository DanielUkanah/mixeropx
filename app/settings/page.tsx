"use client";
import { useEffect, useState } from "react";
import { useStore, CATEGORIES } from "@/lib/store";
import { naira, ago } from "@/lib/format";
import Icon from "@/components/icons";

function Switch({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-ink/50">{hint}</p>}
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`keep-colors relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-hivis" : "bg-ink/20"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { data, ready, rate, rateBusy, refreshRate, setRateMode, setManualRate, setBudget, setBigExpense, setPrefs, clearAll } = useStore();
  const [manual, setManual] = useState("");
  useEffect(() => {
    if (ready) setManual(String(data.manualRate));
  }, [ready]); // eslint-disable-line
  if (!ready) return null;

  const live = data.rateMode === "live";
  const backup = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `mixeropx-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-[28px] font-semibold tracking-tight">Settings</h1>

      <section className="panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Exchange rate</h2>
            <p className="mt-1 text-sm text-ink/55">Used to show pounds for the owner.</p>
          </div>
          <button className="btn-quiet gap-2" onClick={refreshRate} disabled={rateBusy}>
            <Icon name="refresh" size={15} /> {rateBusy ? "Checking…" : "Check now"}
          </button>
        </div>
        <p className="tnum mt-5 text-3xl font-semibold">£1 = {naira(rate)}</p>
        <p className="mt-1 text-sm text-ink/50">
          {live
            ? data.liveRate
              ? `Live rate${data.liveRaw ? ` (market ${naira(Math.round(data.liveRaw))})` : ""}, rounded to the nearest ₦10. Checked ${ago(data.liveRateAt)}.`
              : `Couldn't reach the rate service yet, so ${naira(data.manualRate)} is being used until it connects.`
            : "Set by you. It will not change on its own."}
        </p>

        <div role="group" aria-label="Rate mode" className="mt-5 inline-flex rounded-lg bg-ink/6 p-1">
          {([["live", "Live"], ["manual", "Manual"]] as const).map(([m, l]) => (
            <button
              key={m}
              aria-pressed={data.rateMode === m}
              onClick={() => setRateMode(m)}
              className={`keep-colors rounded-md px-4 py-1.5 text-sm font-semibold ${data.rateMode === m ? "bg-surface shadow-sm" : "text-ink/55"}`}
            >
              {l}
            </button>
          ))}
        </div>

        {!live && (
          <div className="mt-4 max-w-xs">
            <label htmlFor="mr" className="label">Naira per £1 (rounds to the nearest 10)</label>
            <input
              id="mr"
              type="number"
              min={10}
              className="input"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onBlur={() => {
                const r = Math.max(10, Math.round((Number(manual) || 2000) / 10) * 10);
                setManual(String(r));
                setManualRate(r);
              }}
            />
          </div>
        )}

        <ul className="mt-5 space-y-1.5 text-sm text-ink/55">
          <li>Every expense and payment keeps the rate from the day it was recorded, so changing this only affects new entries.</li>
          <li>The live rate is the official market rate. If your team works with the street rate, use Manual and type it in.</li>
        </ul>
        <p className="mt-3 text-xs text-ink/40">
          Rates By <a className="underline" href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Exchange Rate API</a>
        </p>
      </section>

      <section className="panel">
        <h2 className="font-semibold">Monthly budgets</h2>
        <p className="mb-5 mt-1 text-sm text-ink/55">In naira. Leave blank for no limit. You&apos;ll see a bar on the overview and a warning if one goes over.</p>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c}>
              <label htmlFor={`b-${c}`} className="label">{c}</label>
              <input
                id={`b-${c}`}
                type="number"
                min={0}
                className="input"
                placeholder="No limit"
                value={data.budgets[c] || ""}
                onChange={(e) => setBudget(c, Number(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 max-w-xs border-t border-ink/8 pt-5">
          <label htmlFor="big" className="label">Flag any single expense of this many naira or more (0 to turn off)</label>
          <input id="big" type="number" min={0} className="input" value={data.bigExpense || ""} onChange={(e) => setBigExpense(Number(e.target.value) || 0)} />
        </div>
      </section>

      <section className="panel">
        <h2 className="font-semibold">Email updates</h2>
        <p className="mt-1 text-sm text-ink/55">Choose what the owner would like to receive.</p>
        <div className="mt-4 max-w-sm">
          <label htmlFor="em" className="label">Owner&apos;s email</label>
          <input id="em" type="email" className="input" placeholder="name@example.com" value={data.prefs.email} onChange={(e) => setPrefs({ email: e.target.value })} />
        </div>
        <div className="mt-2 divide-y divide-ink/8">
          <Switch on={data.prefs.daily} onChange={(v) => setPrefs({ daily: v })} label="Daily summary" hint="Money in and out for the day" />
          <Switch on={data.prefs.weekly} onChange={(v) => setPrefs({ weekly: v })} label="Weekly report" hint="Every Monday morning" />
          <Switch on={data.prefs.overdue} onChange={(v) => setPrefs({ overdue: v })} label="Overdue invoice reminders" />
          <Switch on={data.prefs.bigSpend} onChange={(v) => setPrefs({ bigSpend: v })} label="Large expense alerts" />
        </div>
        <p className="mt-3 rounded-xl bg-hivis-soft px-4 py-3 text-xs text-hivis-dark">
          Your choices are saved, but no emails are sent yet. Sending needs the app connected to a server, which is the next step.
        </p>
      </section>

      <section className="panel">
        <h2 className="font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-ink/55">Everything is stored in this browser for now. Receipt photos stay on this device and are not in the backup file.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-quiet gap-2" onClick={backup}><Icon name="download" size={15} /> Download backup</button>
          <button className="btn-quiet" onClick={() => confirm("Delete all invoices and expenses?") && clearAll()}>Clear sample data</button>
        </div>
      </section>
    </div>
  );
}
