-- Opinie o rekolekcjach: jedna tabela, odpowiedzi w jsonb (opracowanie później).
-- Moduł tymczasowy – do przeniesienia do innego projektu. Dostęp tylko przez serwer (service role).

create table if not exists opinions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- które rekolekcje (z linku `/opinie?r=<nazwa>`), może być puste
  retreat text check (retreat is null or length(retreat) <= 100),
  -- [{"id": "...", "question": "treść pytania", "answer": "..."}] – z treścią pytania, żeby dane były samoopisujące
  answers jsonb not null
);
create index if not exists opinions_created_idx on opinions (created_at desc);

alter table opinions enable row level security;
