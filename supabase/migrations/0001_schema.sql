-- Familiada małżeńska: schemat bazy.
-- Cały dostęp idzie przez serwer (service role). RLS włączone, brak polityk dla anon.

create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default false,
  survey_open boolean not null default true,
  -- przypisanie pytań do gry: {"rounds": [uuid|null x5], "final": [uuid|null x5]}
  game_plan jsonb not null default '{"rounds":[null,null,null,null,null],"final":[null,null,null,null,null]}'::jsonb,
  created_at timestamptz default now()
);

-- najwyżej jedno aktywne wydarzenie naraz
create unique index if not exists events_one_active on events (is_active) where is_active;

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  position int not null,
  audience text not null check (audience in ('all','wife','husband')),
  text text not null check (length(text) between 1 and 200),
  hidden boolean not null default false
);
create index if not exists questions_event_idx on questions (event_id, position);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  device_id uuid not null,
  role text not null check (role in ('wife','husband')),
  created_at timestamptz default now(),
  unique (event_id, device_id)
);

create table if not exists answer_groups (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions on delete cascade,
  label text not null check (length(label) between 1 and 60),
  hidden boolean not null default false
);
create index if not exists answer_groups_question_idx on answer_groups (question_id);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions on delete cascade,
  question_id uuid not null references questions on delete cascade,
  raw text not null check (length(raw) between 1 and 60),
  normalized text not null,
  group_id uuid references answer_groups on delete set null,
  unique (submission_id, question_id)
);
create index if not exists answers_question_idx on answers (question_id);
create index if not exists answers_group_idx on answers (group_id);

create table if not exists game_state (
  event_id uuid primary key references events on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table events enable row level security;
alter table questions enable row level security;
alter table submissions enable row level security;
alter table answers enable row level security;
alter table answer_groups enable row level security;
alter table game_state enable row level security;

-- Zapis ankiety w jednej transakcji: zgłoszenie + wszystkie odpowiedzi albo nic.
-- p_answers: [{"question_id": uuid, "raw": text, "normalized": text}, ...]
-- Zwraca 'ok' albo 'duplicate' / 'closed' / 'no_event'.
create or replace function submit_survey(
  p_event_id uuid, p_device_id uuid, p_role text, p_answers jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_open boolean;
  v_submission uuid;
begin
  select survey_open into v_open from events where id = p_event_id;
  if v_open is null then return 'no_event'; end if;
  if not v_open then return 'closed'; end if;

  insert into submissions (event_id, device_id, role)
  values (p_event_id, p_device_id, p_role)
  on conflict (event_id, device_id) do nothing
  returning id into v_submission;
  if v_submission is null then return 'duplicate'; end if;

  insert into answers (submission_id, question_id, raw, normalized)
  select v_submission, a.question_id, a.raw, a.normalized
  from jsonb_to_recordset(p_answers) as a(question_id uuid, raw text, normalized text)
  join questions q on q.id = a.question_id
    and q.event_id = p_event_id
    and not q.hidden
    and (q.audience = 'all' or q.audience = p_role);

  return 'ok';
end;
$$;

revoke all on function submit_survey(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function submit_survey(uuid, uuid, text, jsonb) to service_role;

-- Statystyki pytań do panelu (zliczane w bazie, żeby nie pobierać wszystkich odpowiedzi).
create or replace function question_stats(p_event_id uuid)
returns table (question_id uuid, answer_count bigint, ungrouped_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select q.id, count(a.id), count(a.id) filter (where a.group_id is null)
  from questions q
  left join answers a on a.question_id = q.id
  where q.event_id = p_event_id
  group by q.id;
$$;

revoke all on function question_stats(uuid) from public, anon, authenticated;
grant execute on function question_stats(uuid) to service_role;
