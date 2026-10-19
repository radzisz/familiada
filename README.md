# Familiada małżeńska

Ankieta w telefonie (QR) w ciągu dnia → automatycznie zliczone i pogrupowane odpowiedzi → gra na rzutniku wieczorem. Zero ręcznego liczenia.

**Rozgrywka** to komplet: własne pytania, odpowiedzi z ankiety, wybór pytań do gry i stan tablicy. Rozgrywek może być dowolnie wiele (testowa, prawdziwa, kolejne rekolekcje) i działają niezależnie – każda pod adresem ze swoim id.

| Ścieżka | Kto | Co robi |
| --- | --- | --- |
| `/admin` | prowadzący (PIN) | lista rozgrywek z linkami, tworzenie nowej (pytania domyślne / skopiowane / bez), zmiana nazwy, oznaczenie „testowa”, usuwanie |
| `/admin/<id>` | prowadzący (PIN) | panel rozgrywki: licznik zgłoszeń, otwieranie/zamykanie ankiety; zakładka „Pytania i odpowiedzi” (lista pytań, grupowanie AI lub bez, wynik); zakładka „Przygotowanie do gry” (wybór pytań do rund i finału – ręcznie lub automatycznie); w rozgrywce testowej panel „Dane testowe” |
| `/ankieta/<id>` | uczestnik (z QR) | anonimowa ankieta, jedna na telefon (osobno w każdej rozgrywce) |
| `/qr/<id>` | prowadzący (PIN), rzutnik | duży kod QR z linkiem do `/ankieta/<id>` |
| `/tablica/<id>` | prowadzący (PIN), rzutnik | rundy 1–5 (×1 ×1 ×1 ×2 ×3), odkrywanie, X, pule, finał ze stoperem |
| `/tablica/<id>?pilot=1` | prowadzący, telefon | ten sam panel bez tablicy i bez dźwięku – steruje grą na rzutniku |
| `/opinie` | uczestnik | anonimowa ankieta opinii o rekolekcjach (`?r=<nazwa>` – inne rekolekcje); moduł tymczasowy, do przeniesienia do innego projektu |
| `/admin/opinie` | prowadzący (PIN) | opinie: przeglądanie ankiet jedna po drugiej, podsumowanie (najwyżej/najniżej ocenione, wszystkie odpowiedzi otwarte, podsumowanie AI na żądanie), tabela ze średnimi, kontakty, eksport CSV; filtr rekolekcji (`?r=`) |
| `/admin/opinie/raport` | prowadzący (PIN) | raport graficzny dla organizatorów (liczby, oceny w obszarach, rozkłady, NPS) – „Pobierz PDF” ściąga gotowy plik A4 z `/api/admin/opinie/raport` (generowany na serwerze, `@react-pdf/renderer`); `?otwarte=1` dołącza odpowiedzi otwarte |
| `/` | wszyscy | strona Animatorni: platforma, narzędzia, dla kogo, cennik, formularz „Napisz do nas” (treści w `src/lib/site.ts`) |
| `/familiada`, `/ankiety`, `/spiewnik` | wszyscy | landingi narzędzi (śpiewnik oznaczony „wkrótce”) |
| `/admin/kontakt` | prowadzący (PIN) | zapytania z formularza na stronie |

Stack: Next.js 15 (App Router, TypeScript), Supabase (Postgres), Anthropic API (Claude) do grupowania, zwykły CSS.

## 1. Zmienne środowiskowe

Skopiuj `.env.example` do `.env.local` i uzupełnij:

| Zmienna | Skąd |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ten sam ekran, klucz `anon` / publishable (aplikacja go nie potrzebuje do działania – anon nie ma dostępu do tabel) |
| `SUPABASE_SERVICE_ROLE_KEY` | klucz `service_role` / secret – **tylko serwer** |
| `ANTHROPIC_API_KEY` | console.anthropic.com – opcjonalny; bez niego działa grupowanie po pisowni |
| `ADMIN_PIN` | dowolny PIN prowadzącego (najlepiej 6+ cyfr) |
| `ANTHROPIC_MODEL` | opcjonalnie, domyślnie `claude-opus-5-5` |
| `NEXT_PUBLIC_BASE_URL` | opcjonalnie, adres w kodzie QR (domyślnie adres, pod którym otwarto `/qr`) |

**Supabase podłączony przez integrację Vercel:** zmienne bazy (`NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SECRET_KEY`) ustawia integracja – aplikacja przyjmuje obie nazwy. Ręcznie dodaj tylko `ADMIN_PIN` i (opcjonalnie) `ANTHROPIC_API_KEY`. Lokalnie: `vercel env pull .env.local`.

## 2. Baza danych (Supabase)

**Chmura (produkcja):** migracje wgrywają się same – nowy plik w `supabase/migrations/` wypchnięty na `main` trafia do bazy przez integrację Supabase z GitHubem (patrz „Model deploymentu” w punkcie 4). Niczego nie uruchamiasz ręcznie. Lista poniżej to opis migracji (i kolejność na wypadek ręcznego stawiania bazy w SQL Editorze):

1. `supabase/migrations/0001_schema.sql` – tabele, RLS, funkcje,
2. `supabase/migrations/0002_seed.sql` – pierwsza rozgrywka z 26 pytaniami (opcjonalnie – rozgrywki tworzysz też w `/admin`),
3. `supabase/migrations/0003_rozgrywki.sql` – oznaczenie „testowa”, licznik rozgrywek, usunięcie „aktywnego wydarzenia”. **Uruchom też, jeśli baza ma już 0001–0002.**
4. `supabase/migrations/0004_board_title.sql` – własny tytuł gry na tablicy (Ustawienia rozgrywki). **Uruchom też na istniejącej bazie.**
5. `supabase/migrations/0005_branding.sql` – nazwa wydarzenia i współorganizator z logo (Ustawienia rozgrywki); istniejącym rozgrywkom wpisuje dotychczasowe „Rekolekcje dla małżeństw · Kraków 2026” i Wspólnotę Małżeństw. **Uruchom też na istniejącej bazie.**
6. `supabase/migrations/0006_logo_version.sql` – wersja logo współorganizatora (logo idzie osobnym adresem `/api/logo/<id>`, z cache). **Uruchom też na istniejącej bazie.**
7. `supabase/migrations/0007_save_game_state.sql` – zapis stanu gry jednym zapytaniem (funkcja `upsert_game_state`). **Wymagana przed wdrożeniem kodu, który jej używa.**
8. `supabase/migrations/0008_opinions.sql` – tabela `opinions` (opinie o rekolekcjach z `/opinie`, odpowiedzi w jsonb).
9. `supabase/migrations/0009_opinion_contacts.sql` – tabela `opinion_contacts` (opcjonalny kontakt po ankiecie opinii, ze zgodą; bez powiązania z odpowiedziami).
10. `supabase/migrations/0010_contact_requests.sql` – tabela `contact_requests` (zapytania z formularza „Napisz do nas” na stronie).

Albo zamiast kroku 2: `npm run seed` (używa `.env.local`).

**Lokalnie (Docker):** `npx supabase start` – migracje i seed wchodzą same; adres i klucze wypisze komenda (porty 564xx, patrz `supabase/config.toml`). `npx supabase db reset` czyści bazę.

**Rozgrywka testowa:** w `/admin` utwórz rozgrywkę z zaznaczonym „testowa”. W jej panelu „Dane testowe” dodaje 10–80 losowych ankiet (pule z literówkami i synonimami w `src/lib/data/test-answers.json`) i jednym przyciskiem czyści odpowiedzi, grupy i stan gry. W rozgrywce nietestowej te przyciski są zablokowane, więc prawdziwe dane się nie pomieszają.

Z konsoli (dodatkowo sprawdza drogę HTTP `/api/submit`): `npm run seed:answers -- --event <id> [--count 80] [--url http://localhost:3456]`; dla adresu innego niż lokalny trzeba dodać `--yes`; `--clear` usuwa tylko ankiety wysłane tym skryptem.

**Kolejne rekolekcje:** w `/admin` „Nowa rozgrywka” → „skopiuj z: …” przenosi pytania (bez odpowiedzi). Z konsoli: `npm run seed -- --new "Rekolekcje wiosna 2027" [--test]`.

Bezpieczeństwo: RLS jest włączone na wszystkich tabelach, bez polityk dla `anon`. Cały dostęp idzie przez serwer kluczem service role po sprawdzeniu PIN-u (cookie httpOnly z HMAC, ważne 24 h). Ankieta zapisuje się jedną transakcją (`submit_survey`), unikalny indeks `(event_id, device_id)` blokuje drugą ankietę z tego samego telefonu w tej samej rozgrywce; odpowiedzi na pytania z innej rozgrywki są odrzucane. Id rozgrywki to losowy UUID, więc linku do ankiety nie da się zgadnąć.

## 3. Uruchomienie lokalne

```bash
npm install
npm run dev          # http://localhost:3000
npm run check        # typecheck + eslint (0 ostrzeżeń) + testy jednostkowe
```

## 4. Deploy na Vercel

**Model deploymentu:** `git push` na `main` i nic więcej.

- **Aplikacja** – Vercel buduje i wdraża każdy push na `main` (funkcje w regionie `dub1`, `vercel.json`).
- **Baza** – integracja Supabase z GitHubem wgrywa nowe migracje z `supabase/migrations/` przy tym samym pushu. Migracje muszą być bezpieczne do ponownego uruchomienia (`if not exists`, `create or replace`) i zgodne z kodem, który chodzi chwilę dłużej po starej wersji.
- Zmienne środowiskowe ustawia integracja Supabase w Vercel (punkt 1).

Pierwsze postawienie:

1. Wypchnij repozytorium na GitHub i zaimportuj je w Vercel (framework wykryje się sam).
2. W Vercel → Settings → Environment Variables dodaj zmienne z punktu 1.
3. Deploy. Grupowanie AI ma `maxDuration = 120 s` – na planie Hobby limit to 60 s, co przy ~80 odpowiedziach wystarcza.
4. Otwórz `https://twoja-aplikacja.vercel.app/admin`, zaloguj się PIN-em, przy rozgrywce kliknij „Kod QR” i sprawdź telefonem, czy kod otwiera ankietę.

## 5. Test całości w 5 minut

0. Szybciej: utwórz rozgrywkę testową i zamiast kroków 2–3 kliknij „Dodaj testowe ankiety”; po teście „Wyczyść odpowiedzi…” albo usuń całą rozgrywkę.
1. `/admin` bez PIN-u pokazuje tylko pole PIN; zaloguj się i otwórz panel rozgrywki.
2. Na telefonie zeskanuj „Kod QR” rozgrywki → „Żona” → widzisz pytania dla żon i wspólne → wpisz np. „Ciuchy” w pytaniu 1 → Wyślij → „Dziękujemy!”. Odśwież → „Już odpowiedziałeś”.
3. W trybie incognito (lub na drugim telefonie) → „Mąż” → wpisz „ubrania!” i „Bluzki” w pytaniach. Licznik w panelu rośnie sam.
4. W panelu kliknij pytanie → odpowiedzi pogrupują się po pisowni. „Pogrupuj z AI” (dwa kliknięcia) połączy je w „Ubrania”. Przenieś odpowiedź listą „przenieś do…” lub przeciągnij ją, zmień etykietę, ukryj grupę.
5. Zakładka „Przygotowanie do gry”: „Uzupełnij puste automatycznie” (albo „Wybierz wszystko od nowa”) dobiera pytania – do rund z pełną tablicą (runda 2 dla mężów, runda 3 dla żon), do finału wspólne z wyraźnym liderem. Pod każdym wyborem widać podgląd tablicy i ostrzeżenie o niepogrupowanych odpowiedziach; każde miejsce można zmienić ręcznie.
6. „Tablica” z panelu (`/tablica/<id>`): klawisze `1`–`6` odkrywają, `X` błąd, „Pula dla Żon/Mężów”, `H` chowa panel, „Pełny ekran”. Odśwież stronę – wynik zostaje. Zakładka „Finał”: wybór odpowiedzi (osoba 2 nie może powtórzyć), stoper 20/25 s, cel 200.
7. „Zamknij ankietę” (dwa kliknięcia) → link ankiety pokazuje „Ankieta zamknięta”.

## Jak liczone są punkty

Punkty odpowiedzi = `round(liczba osób w grupie / liczba osób, które odpowiedziały na to pytanie × 100)`. Na tablicę trafia 6 największych widocznych grup, malejąco. Ukryte grupy (żarty, nieczytelne) nie pojawiają się na tablicy, ale liczą się do mianownika.

## Struktura

- `src/lib/` – czysta logika z testami: normalizacja, punktacja, grupowanie, automatyczny wybór pytań, odpowiedzi testowe, reducer gry, token sesji. `src/lib/data/` – 26 domyślnych pytań i pule odpowiedzi testowych.
- `src/lib/server/` – dostęp do bazy (`repo/`), auth, wywołanie Claude (`ai.ts`). Funkcje zapisujące mają w nazwie `insert/update/delete/apply/upsert`.
- `src/app/api/` – Route Handlers.
- `src/components/` – ankieta, panel, tablica, QR.
- `tests/` – testy jednostkowe (Vitest).
