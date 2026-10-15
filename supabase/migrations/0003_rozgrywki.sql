-- Rozgrywki: wiele niezależnych wydarzeń (testowe, prawdziwe, kolejne edycje), każde pod własnym adresem
-- (/admin/<id>, /ankieta/<id>, /qr/<id>, /tablica/<id>). Pojęcie „aktywnego wydarzenia” znika.

alter table events add column if not exists is_test boolean not null default false;

drop index if exists events_one_active;
alter table events drop column if exists is_active;

-- Liczniki do listy rozgrywek (bez pobierania wszystkich wierszy).
create or replace function event_summaries()
returns table (event_id uuid, submission_count bigint, question_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.id,
    (select count(*) from submissions s where s.event_id = e.id),
    (select count(*) from questions q where q.event_id = e.id)
  from events e;
$$;

revoke all on function event_summaries() from public, anon, authenticated;
grant execute on function event_summaries() to service_role;
