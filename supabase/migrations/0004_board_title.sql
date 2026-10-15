-- Własny tytuł gry na tablicy (nagłówek, ekran startowy); null = domyślny „Familiada Małżeńska”.
alter table events add column if not exists board_title text
  check (board_title is null or char_length(board_title) between 1 and 60);
