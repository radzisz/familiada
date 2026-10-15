-- Oprawa rozgrywki (Ustawienia): nazwa wydarzenia i współorganizator z logo.
-- Fundacja YoungTree jest w aplikacji na stałe, tu tylko drugi organizator.
alter table events add column if not exists event_name text
  check (event_name is null or char_length(event_name) between 1 and 100);
alter table events add column if not exists partner_name text
  check (partner_name is null or char_length(partner_name) between 1 and 80);
alter table events add column if not exists partner_url text
  check (partner_url is null or char_length(partner_url) <= 300);
-- data URL wykadrowanego logo albo ścieżka /logos/… z aplikacji
alter table events add column if not exists partner_logo text
  check (partner_logo is null or char_length(partner_logo) <= 300000);

-- Dotychczasowe rozgrywki wyglądają jak wcześniej (napis i logo były wpisane na sztywno).
update events
set event_name = 'Rekolekcje dla małżeństw · Kraków 2026',
    partner_name = 'Wspólnota Małżeństw',
    partner_url = 'https://wspolnotamalzenstw.pl/',
    partner_logo = '/logos/wspolnota-malzenstw.png'
where event_name is null and partner_name is null and partner_logo is null;
