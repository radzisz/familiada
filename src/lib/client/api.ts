export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

/** fetch + JSON z czytelnym błędem po polsku; nigdy nie rzuca. */
export async function apiJson<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    const body: unknown = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data: body as T };
    const message = (body as { error?: string } | null)?.error ?? `Błąd ${res.status}`;
    return { ok: false, status: res.status, error: message };
  } catch (err) {
    console.warn("[api]", url, err);
    return { ok: false, status: 0, error: "Brak połączenia z internetem. Spróbuj ponownie." };
  }
}

export function postJson<T>(url: string, body: unknown, method = "POST"): Promise<ApiResult<T>> {
  return apiJson<T>(url, { method, body: JSON.stringify(body) });
}
