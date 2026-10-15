/** Tytuł gry na tablicy (nagłówek, ekran startowy), gdy w Ustawieniach rozgrywki nie wpisano innego. */
export const DEFAULT_BOARD_TITLE = "Familiada Małżeńska";
export const BOARD_TITLE_MAX = 60;

/** Tytuł do pokazania: zapisany (bez spacji na brzegach) albo domyślny. */
export function boardTitle(stored: string | null): string {
  const title = stored?.trim() ?? "";
  return title === "" ? DEFAULT_BOARD_TITLE : title;
}

/** Co zapisać w bazie: null, gdy tytuł pusty albo równy domyślnemu (zmiana domyślnego obejmie wtedy i tę rozgrywkę). */
export function storedBoardTitle(input: string): string | null {
  const title = input.trim();
  return title === "" || title === DEFAULT_BOARD_TITLE ? null : title;
}
