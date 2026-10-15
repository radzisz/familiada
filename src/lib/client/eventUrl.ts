/** Dokleja `event=<id>` do adresu endpointu – każdy endpoint panelu działa na jednej rozgrywce. */
export function eventUrl(path: string, eventId: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}event=${encodeURIComponent(eventId)}`;
}
