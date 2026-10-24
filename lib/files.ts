import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { fb } from "./firebase";

// Receipts are saved in Firestore so the owner can see them too.
export type StoredFile = { name: string; type: string; blob: Blob };
const MAX_BYTES = 700 * 1024; // Firestore documents are limited to 1 MB

const toDataUrl = (b: Blob) =>
  new Promise<string>((ok, no) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => no(r.error);
    r.readAsDataURL(b);
  });

export async function putFile(id: string, f: StoredFile) {
  const x = fb();
  if (!x) throw new Error("Firebase is not connected");
  if (f.blob.size > MAX_BYTES) throw new Error("File too big");
  const data = await toDataUrl(f.blob);
  setDoc(doc(x.db, "receipts", id), { name: f.name, type: f.type, data }).catch(console.error);
}

export async function getFile(id: string): Promise<StoredFile | undefined> {
  const x = fb();
  if (!x) return undefined;
  const d = await getDoc(doc(x.db, "receipts", id));
  if (!d.exists()) return undefined;
  const v = d.data();
  const blob = await (await fetch(v.data)).blob();
  return { name: v.name, type: v.type, blob };
}

export async function delFile(id: string) {
  const x = fb();
  if (x) await deleteDoc(doc(x.db, "receipts", id));
}

// Shrinks phone photos so they stay small. PDFs pass through untouched.
export async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b ?? file), "image/jpeg", 0.7));
  } catch {
    return file;
  }
}