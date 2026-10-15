# Familiada małżeńska

Ankieta w telefonie (QR) w ciągu dnia → automatycznie zliczone i pogrupowane odpowiedzi → gra na rzutniku wieczorem. Zero ręcznego liczenia.

| Ścieżka | Kto | Co robi |
| --- | --- | --- |
| `/` | uczestnik (z QR) | anonimowa ankieta, jedna na telefon |
| `/admin` | prowadzący (PIN) | licznik zgłoszeń, pytania, grupowanie (AI lub bez), wynik, wybór pytań do gry, eksport CSV |
| `/tablica` | prowadzący (PIN), rzutnik | rundy 1–5 (×1 ×1 ×1 ×2 ×3), odkrywanie, X, pule, finał ze stoperem |
| `/tablica?pilot=1` | prowadzący, telefon | ten sam panel bez tablicy i bez dźwięku – steruje grą na rzutniku |
| `/qr` | prowadzący (PIN), rzutnik | duży kod QR z linkiem do ankiety |

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

**Chmura (produkcja):** w Supabase → SQL Editor uruchom po kolei:

1. `supabase/migrations/0001_schema.sql` – tabele, RLS, funkcje,
2. `supabase/migrations/0002_seed.sql` – aktywne wydarzenie i 26 pytań.

Albo zamiast kroku 2: `npm run seed` (używa `.env.local`).

**Lokalnie (Docker):** `npx supabase start` – migracje i seed wchodzą same; adres i klucze wypisze komenda (porty 564xx, patrz `supabase/config.toml`). `npx supabase db reset` czyści bazę.

**Kolejna edycja rekolekcji:** `npm run seed -- --new "Rekolekcje wiosna 2027"` – tworzy nowe aktywne wydarzenie z 26 pytaniami, stare dane zostają w bazie.

Bezpieczeństwo: RLS jest włączone na wszystkich tabelach, bez polityk dla `anon`. Cały dostęp idzie przez serwer kluczem service role po sprawdzeniu PIN-u (cookie httpOnly z HMAC, ważne 24 h). Ankieta zapisuje się jedną transakcją (`submit_survey`), unikalny indeks `(event_id, device_id)` blokuje drugą ankietę z tego samego telefonu.

## 3. Uruchomienie lokalne

```bash
npm install
npm run dev          # http://localhost:3000
npm run check        # typecheck + eslint (0 ostrzeżeń) + testy jednostkowe
```

## 4. Deploy na Vercel

1. Wypchnij repozytorium na GitHub i zaimportuj je w Vercel (framework wykryje się sam).
2. W Vercel → Settings → Environment Variables dodaj zmienne z punktu 1.
3. Deploy. Grupowanie AI ma `maxDuration = 120 s` – na planie Hobby limit to 60 s, co przy ~80 odpowiedziach wystarcza.
4. Otwórz `https://twoja-aplikacja.vercel.app/qr`, zaloguj się PIN-em i sprawdź telefonem, czy kod otwiera ankietę.

## 5. Test całości w 5 minut

1. `/admin` bez PIN-u pokazuje tylko pole PIN; zaloguj się.
2. Na telefonie zeskanuj kod z `/qr` → „Żona” → widzisz pytania dla żon i wspólne → wpisz np. „Ciuchy” w pytaniu 1 → Wyślij → „Dziękujemy!”. Odśwież → „Już odpowiedziałeś”.
3. W trybie incognito (lub na drugim telefonie) → „Mąż” → wpisz „ubrania!” i „Bluzki” w pytaniach. Licznik w `/admin` rośnie sam.
4. W `/admin` kliknij pytanie → odpowiedzi pogrupują się po pisowni. „Pogrupuj z AI” (dwa kliknięcia) połączy je w „Ubrania”. Przenieś odpowiedź listą „przenieś do…” lub przeciągnij ją, zmień etykietę, ukryj grupę.
5. W „Wybór pytań do gry” przypisz pytania do rund 1–5 i finału.
6. `/tablica`: klawisze `1`–`6` odkrywają, `X` błąd, „Pula dla Żon/Mężów”, `H` chowa panel, „Pełny ekran”. Odśwież stronę – wynik zostaje. Zakładka „Finał”: wybór odpowiedzi (osoba 2 nie może powtórzyć), stoper 20/25 s, cel 200.
7. „Eksport CSV” w `/admin` – kopia zapasowa wyników na wypadek braku internetu wieczorem.
8. „Zamknij ankietę” (dwa kliknięcia) → `/` pokazuje „Ankieta zamknięta”.

## Jak liczone są punkty

Punkty odpowiedzi = `round(liczba osób w grupie / liczba osób, które odpowiedziały na to pytanie × 100)`. Na tablicę trafia 6 największych widocznych grup, malejąco. Ukryte grupy (żarty, nieczytelne) nie pojawiają się na tablicy, ale liczą się do mianownika.

## Struktura

- `src/lib/` – czysta logika z testami: normalizacja, punktacja, grupowanie, reducer gry, token sesji, CSV.
- `src/lib/server/` – dostęp do bazy (`repo/`), auth, wywołanie Claude (`ai.ts`). Funkcje zapisujące mają w nazwie `insert/update/delete/apply/upsert`.
- `src/app/api/` – Route Handlers.
- `src/components/` – ankieta, panel, tablica, QR.
- `tests/` – testy jednostkowe (Vitest).
