// Receipts live in the browser's IndexedDB for now (same limitation as the rest of the data).
export type StoredFile = { name: string; type: string; blob: Blob };
const DB = "mixeropx-files";
const ST = "files";

function db(): Promise<IDBDatabase> {
  return new Promise((ok, no) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((ok, no) => {
        const tx = d.transaction(ST, mode);
        const q = fn(tx.objectStore(ST));
        tx.oncomplete = () => {
          d.close();
          ok(q.result);
        };
        tx.onerror = () => no(tx.error);
      })
  );
}

export const putFile = (id: string, f: StoredFile) => run("readwrite", (s) => s.put(f, id));
export const getFile = (id: string) => run<StoredFile | undefined>("readonly", (s) => s.get(id));
export const delFile = (id: string) => run("readwrite", (s) => s.delete(id));

// Shrinks phone photos so they stay small. PDFs pass through untouched.
export async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b ?? file), "image/jpeg", 0.8));
  } catch {
    return file;
  }
}
