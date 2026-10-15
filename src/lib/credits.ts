import { HOST_PARTNER } from "./branding";

/**
 * Kto prowadzi serwis i kto go zbudował – stopka ankiety, panelu i logowania
 * (jak w rozerrozancowe.org). Zmiana operatora lub dostawcy to jedna linijka.
 */
export const OPERATOR = { name: HOST_PARTNER.name, href: "https://youngtree.org", logo: HOST_PARTNER.src } as const;

/** PoleForce nie ma jeszcze pliku z logo w projekcie, więc tylko nazwa. */
export const VENDOR = { name: "PoleForce", href: "https://poleforce.co" } as const;
