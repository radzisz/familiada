-- Zapis stanu gry jednym zapytaniem (wcześniej: odczyt rozgrywki, odczyt stanu, zapis – trzy podróże do bazy
-- przy każdym kliknięciu na pilocie). Starszy stan (niższe „rev”) nie nadpisuje nowszego; sprawdzenie i zapis
-- są atomowe, więc dwa ekrany zapisujące naraz nie cofną się nawzajem.
-- Zwraca: {"ok": true} | {"ok": false, "state": <nowszy stan z bazy>} | null, gdy rozgrywki nie ma.
create or replace function upsert_game_state(p_event_id uuid, p_state jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  newer jsonb;
begin
  if not exists (select 1 from events where id = p_event_id) then
    return null;
  end if;
  insert into game_state (event_id, state, updated_at)
  values (p_event_id, p_state, now())
  on conflict (event_id) do update
    set state = excluded.state, updated_at = now()
    where coalesce((game_state.state ->> 'rev')::bigint, -1) <= coalesce((excluded.state ->> 'rev')::bigint, -1);
  if found then
    return jsonb_build_object('ok', true);
  end if;
  select state into newer from game_state where event_id = p_event_id;
  return jsonb_build_object('ok', false, 'state', newer);
end;
$$;

revoke all on function upsert_game_state(uuid, jsonb) from public, anon, authenticated;
grant execute on function upsert_game_state(uuid, jsonb) to service_role;
