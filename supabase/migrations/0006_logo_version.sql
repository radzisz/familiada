-- Wersja logo współorganizatora: zmienia się przy każdym wgraniu, więc adres /api/logo/<id>?v=<wersja>
-- można trzymać w cache na stałe, a samo logo nie jedzie z bazy przy każdym zapytaniu o stan gry.
alter table events add column if not exists partner_logo_version bigint;
update events set partner_logo_version = 1 where partner_logo is not null and partner_logo_version is null;
