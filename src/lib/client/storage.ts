/** localStorage, który nie wywraca strony w trybie prywatnym ani przy zablokowanym storage. */
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    console.warn("[storage] read failed", key, err);
    return null;
  }
}

export function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch (err) {
    console.warn("[storage] write failed", key, err);
  }
}

function fallbackUuid(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Stały, losowy identyfikator urządzenia (UUID v4). */
export function getDeviceId(): string {
  const key = "familiada:device";
  const existing = readStorage(key);
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallbackUuid();
  writeStorage(key, id);
  return id;
}
