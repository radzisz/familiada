-- Seed: aktywne wydarzenie + 26 pytań. Alternatywa dla: npm run seed.
-- Nie robi nic, jeśli istnieje już aktywne wydarzenie.
do $$
declare v_event uuid;
begin
  if exists (select 1 from events where is_active) then
    raise notice 'Aktywne wydarzenie już istnieje, pomijam seed.';
    return;
  end if;
  insert into events (name, is_active) values ('Rekolekcje dla małżeństw', true) returning id into v_event;
  insert into questions (event_id, position, audience, text)
  select v_event, s.position, s.audience, s.text
  from (values
    (1, 'all', 'Na co Polacy najczęściej wydają za dużo?'),
    (2, 'all', 'Co najczęściej kupujemy pod wpływem impulsu?'),
    (3, 'all', 'Jakiego rachunku najbardziej nie lubisz płacić?'),
    (4, 'all', 'Najczęstszy powód kłótni o pieniądze w małżeństwie'),
    (5, 'all', 'Gdzie w domu chowa się pieniądze „na czarną godzinę”?'),
    (6, 'all', 'Na co warto odkładać pieniądze?'),
    (7, 'all', 'Pierwsza rzecz po wygraniu miliona złotych'),
    (8, 'all', 'Co najbardziej podrożało w ostatnich latach?'),
    (9, 'all', 'Na czym najłatwiej zaoszczędzić w domowym budżecie?'),
    (10, 'all', 'Komu najczęściej pożyczamy pieniądze?'),
    (11, 'wife', 'Na co mąż wydaje pieniądze bez sensu?'),
    (12, 'wife', 'Co mąż kupuje „bo było w promocji”?'),
    (13, 'wife', 'Czego mąż w domu nigdy nie wyrzuci?'),
    (14, 'wife', 'W jakim sklepie mąż może spędzić cały dzień?'),
    (15, 'wife', 'Co mąż robi, kiedy dostaje premię?'),
    (16, 'husband', 'Na co żona wydaje pieniądze bez sensu?'),
    (17, 'husband', 'Co żona kupuje „bo było w promocji”?'),
    (18, 'husband', 'Czego żona ma w domu za dużo?'),
    (19, 'husband', 'W jakim sklepie żona może spędzić cały dzień?'),
    (20, 'husband', 'Co żona robi, kiedy dostaje premię?'),
    (21, 'all', 'Rzecz, którą trzymamy w szufladzie, „bo się przyda”'),
    (22, 'all', 'Co dziecko najczęściej chce kupić przy kasie?'),
    (23, 'all', 'Czego szukamy w domu tuż przed wyjściem?'),
    (24, 'all', 'Za co dziecko może dostać kieszonkowe?'),
    (25, 'all', 'Najdziwniejszy prezent ślubny, jaki można dostać'),
    (26, 'all', 'Co robimy z drobnymi z portfela?')
  ) as s(position, audience, text);
end $$;
