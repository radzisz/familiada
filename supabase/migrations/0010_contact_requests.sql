-- Strona Animatorni: zapytania z formularza „Napisz do nas”.
-- Treść zgody zapisana przy każdym wierszu (dowód, na co dokładnie się zgodzono).

create table if not exists contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- familiada | ankiety | spiewnik | pakiet | inne
  topic text not null check (length(topic) between 1 and 30),
  name text check (name is null or length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 200),
  organization text check (organization is null or length(organization) between 1 and 160),
  message text check (message is null or length(message) between 1 and 3000),
  -- strona, z której wysłano formularz
  source text check (source is null or length(source) <= 60),
  consent_text text not null
);
create index if not exists contact_requests_created_idx on contact_requests (created_at desc);

alter table contact_requests enable row level security;
