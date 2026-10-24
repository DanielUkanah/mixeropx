"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { BRAND } from "@/lib/brand";

export default function Login() {
  const { signIn } = useStore();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await signIn(email.trim(), pw);
    } catch {
      setErr("That email or password isn't right.");
    }
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={go} className="panel w-full max-w-sm space-y-4">
        <div className="mb-2">
          <p className="text-2xl font-bold tracking-tight">{BRAND.name}</p>
          <p className="text-sm text-ink/55">Sign in to see the books.</p>
        </div>
        <div>
          <label htmlFor="em" className="label">Email</label>
          <input id="em" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="pw" className="label">Password</label>
          <input id="pw" type="password" autoComplete="current-password" required className="input" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        {err && <p role="alert" className="text-sm text-spark">{err}</p>}
        <button className="btn-accent w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}