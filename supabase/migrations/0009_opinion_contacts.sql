-- Opinie o rekolekcjach: opcjonalne dane kontaktowe z ostatniego kroku ankiety.
-- Osobna tabela bez powiązania z `opinions` – odpowiedzi zostają anonimowe.
-- Treść zgody zapisana przy każdym wierszu (dowód, na co dokładnie się zgodzono).

create table if not exists opinion_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  retreat text check (retreat is null or length(retreat) <= 100),
  name text check (name is null or length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 200),
  consent_text text not null
);
create index if not exists opinion_contacts_created_idx on opinion_contacts (created_at desc);

alter table opinion_contacts enable row level security;
