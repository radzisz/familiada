import { DEFAULT_BOARD_TITLE } from "./boardTitle";

/**
 * Oprawa rozgrywki: nazwa wydarzenia i organizatorzy (loga w ankiecie oraz na ekranie startowym
 * i końcowym tablicy). Fundacja YoungTree jest zawsze; współorganizatora ustawia się w Ustawieniach.
 */

export interface Partner {
  name: string;
  href: string | null;
  src: string;
  /**
   * Logo współorganizatora (z /api/logo, wykadrowane w panelu na białym tle): wypełnia cały krążek
   * i idzie bez optymalizacji next/image (adres z `?v=`, a plik i tak jest mały).
   */
  fill: boolean;
}

export const HOST_PARTNER: Partner = {
  name: "Fundacja YoungTree",
  href: "https://youngtree.org/",
  src: "/logos/youngtree.png",
  fill: false,
};

export const EVENT_NAME_MAX = 100;
export const PARTNER_NAME_MAX = 80;
export const PARTNER_URL_MAX = 300;
/** Wykadrowane logo 320×320 jako data URL ma zwykle 10–60 tys. znaków; limit z zapasem. */
export const PARTNER_LOGO_MAX = 300_000;

export interface CoOrganizer {
  name: string;
  url: string | null;
  /**
   * Przy odczycie: adres logo (`/api/logo/<id>?v=<wersja>`). W PATCH: ten sam adres = logo bez zmian,
   * data URL = nowe wykadrowane logo.
   */
  logo: string;
}

export interface Branding {
  /** Tytuł gry (tablica, nagłówek ankiety). */
  title: string;
  /** Nazwa wydarzenia, np. „Rekolekcje dla małżeństw · Kraków 2026”; null = nie pokazujemy. */
  eventName: string | null;
  partners: Partner[];
}

/** Oprawa stron bez rozgrywki (strona główna, nieistniejąca ankieta). */
export const DEFAULT_BRANDING: Branding = { title: DEFAULT_BOARD_TITLE, eventName: null, partners: [HOST_PARTNER] };

const DATA_LOGO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
const PUBLIC_LOGO = /^\/logos\/[a-z0-9-]+\.(png|jpe?g|webp|svg)$/;

/** Czy to dopuszczalne źródło logo: wykadrowany obrazek (data URL) albo plik z /public/logos. */
export function isLogoSource(src: string): boolean {
  return src.length <= PARTNER_LOGO_MAX && (DATA_LOGO.test(src) || PUBLIC_LOGO.test(src));
}

/** Adres logo współorganizatora; wersja zmienia się przy każdym wgraniu, więc obrazek można trzymać w cache na stałe. */
export function logoUrl(eventId: string, version: number): string {
  return `/api/logo/${eventId}?v=${version}`;
}

/** Czy to adres logo z `logoUrl` (w PATCH znaczy: logo bez zmian). */
export function isServedLogo(src: string): boolean {
  return /^\/api\/logo\/[0-9a-f-]{36}\?v=\d+$/.test(src);
}

/** Tekst do zapisu w bazie: bez spacji na brzegach, pusty = null. */
export function storedText(input: string): string | null {
  const text = input.trim();
  return text === "" ? null : text;
}

/** Organizatorzy do pokazania: zawsze YoungTree, potem współorganizator (jeśli ustawiony). */
export function partnersFor(co: CoOrganizer | null): Partner[] {
  if (!co) return [HOST_PARTNER];
  return [HOST_PARTNER, { name: co.name, href: co.url, src: co.logo, fill: true }];
}

export interface CoOrganizerColumns {
  partner_name: string | null;
  partner_url: string | null;
  /** Wersja logo; null = logo nie wgrano. */
  partner_logo_version: number | null;
}

/** Współorganizator z kolumn bazy – istnieje tylko z nazwą i wgranym logo. */
export function coOrganizerFrom(eventId: string, columns: CoOrganizerColumns): CoOrganizer | null {
  const { partner_name: name, partner_url: url, partner_logo_version: version } = columns;
  if (!name || version === null) return null;
  return { name, url: url || null, logo: logoUrl(eventId, version) };
}
