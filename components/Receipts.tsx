"use client";
import { useEffect, useState } from "react";
import { getFile } from "@/lib/files";
import type { FileMeta } from "@/lib/store";
import Icon from "./icons";

export function ReceiptPicker({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  return (
    <div>
      <p className="label">Receipts or photos (optional)</p>
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-ink/20 bg-ink/[0.02] px-4 py-3 text-sm text-ink/60 focus-within:border-hivis hover:border-hivis hover:text-ink">
        <Icon name="paperclip" size={18} /> Tap to add a photo or PDF
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(e) => {
            onChange([...files, ...Array.from(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <li key={i} className="chip">
              <span className="max-w-[160px] truncate">{f.name}</span>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((_, n) => n !== i))}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReceiptViewer({ files, onClose }: { files: FileMeta[]; onClose: () => void }) {
  const [items, setItems] = useState<{ meta: FileMeta; url: string | null }[]>([]);

  useEffect(() => {
    let dead = false;
    const made: string[] = [];
    (async () => {
      const out: { meta: FileMeta; url: string | null }[] = [];
      for (const m of files) {
        let url: string | null = null;
        try {
          const f = await getFile(m.id);
          if (f) {
            url = URL.createObjectURL(f.blob);
            made.push(url);
          }
        } catch {}
        out.push({ meta: m, url });
      }
      if (!dead) setItems(out);
    })();
    return () => {
      dead = true;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Receipts"
        className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Receipts</h2>
          <button className="btn-quiet" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-4">
          {items.map(({ meta, url }) =>
            !url ? (
              <p key={meta.id} className="rounded-xl bg-ink/5 p-4 text-sm text-ink/60">{meta.name} was added on another device, so it isn&apos;t here.</p>
            ) : meta.type.startsWith("image/") ? (
              <img key={meta.id} src={url} alt={meta.name} className="w-full rounded-2xl ring-1 ring-ink/10" />
            ) : (
              <a key={meta.id} href={url} target="_blank" rel="noreferrer" className="btn-quiet gap-2 !rounded-xl !py-3">
                <Icon name="invoices" size={16} /> Open {meta.name}
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}
