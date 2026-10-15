# Familiada małżeńska – specyfikacja aplikacji

Zbuduj prostą aplikację webową do „Familiady małżeńskiej” na rekolekcjach dla małżeństw (ok. 15–40 par).
W ciągu dnia uczestnicy skanują kod QR i anonimowo odpowiadają na ankietę w telefonie.
Wieczorem prowadzący widzi zliczone i pogrupowane odpowiedzi i prowadzi grę na rzutniku (tablica jak w telewizyjnej Familiadzie).
Cel: zero ręcznego liczenia.

W załączniku jest plik `tablica.html`, czyli działający prototyp tablicy (bez backendu). Traktuj go jako wzór wyglądu i logiki gry (sekcje „Gra”, „Finał”, „Kod QR”) i przenieś go do aplikacji.

## Stack

- Next.js (App Router, TypeScript), deploy na Vercel
- Supabase (Postgres + Realtime), bez logowania uczestników
- Anthropic API (model Claude) do automatycznego grupowania podobnych odpowiedzi, wywoływane tylko po stronie serwera
- Tailwind lub zwykły CSS, bez ciężkich bibliotek UI
- QR: biblioteka `qrcode` (generowanie po stronie klienta albo serwera)

Zmienne środowiskowe:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (tylko serwer), `ANTHROPIC_API_KEY` (tylko serwer), `ADMIN_PIN` (PIN prowadzącego).

## Role i ekrany

| Ścieżka | Kto | Co robi |
| --- | --- | --- |
| `/` | uczestnik (z QR) | ankieta |
| `/admin` | prowadzący (PIN) | podgląd napływu odpowiedzi, grupowanie, wybór pytań do gry |
| `/tablica` | prowadzący (PIN), na rzutnik | gra: rundy, odkrywanie, X, punkty, finał |
| `/qr` | prowadzący (PIN), na rzutnik | duży kod QR z linkiem do `/` |

Jedna gra na raz. Wystarczy tabela `events` z jednym aktywnym rekordem, ale zaprojektuj schemat tak, żeby dało się zrobić drugą edycję (kolejne rekolekcje) bez czyszczenia bazy.

## Ankieta (`/`)

Telefon, polski interfejs, duże przyciski, działa bez logowania.

1. Ekran 1: „Kim jesteś?” → dwa duże przyciski **Żona** / **Mąż**.
2. Ekran 2: pytania jedno pod drugim (albo po jednym na ekran z paskiem postępu, wybierz to, co lepiej działa na telefonie). Pole tekstowe na krótką odpowiedź, max 60 znaków, podpowiedź „jedno lub dwa słowa”.
   - Żona widzi pytania z grup `wife` i `all`, mąż z grup `husband` i `all`.
   - Pytania są opcjonalne, można pominąć.
3. Wyślij → ekran „Dziękujemy! Wyniki zobaczysz wieczorem na Familiadzie”.

Zabezpieczenia:
- Jedna ankieta na urządzenie: losowy `device_id` (UUID) w localStorage, wysyłany z odpowiedziami. Unikalny indeks `(event_id, device_id)`. Ponowne wejście pokazuje „Już odpowiedziałeś, dziękujemy”.
- Zapis przez Route Handler albo Server Action (service role), a nie bezpośrednio z klienta. RLS włączone, anon nie ma dostępu do tabel.
- Prosty limit: max 1 zgłoszenie na `device_id`, odrzucanie pustych zgłoszeń.

## Pytania (seed)

`group`: `all` = wszyscy, `wife` = odpowiadają żony (w grze zgadują mężowie), `husband` = odpowiadają mężowie (w grze zgadują żony).

| # | group | Pytanie |
| --- | --- | --- |
| 1 | all | Na co Polacy najczęściej wydają za dużo? |
| 2 | all | Co najczęściej kupujemy pod wpływem impulsu? |
| 3 | all | Jakiego rachunku najbardziej nie lubisz płacić? |
| 4 | all | Najczęstszy powód kłótni o pieniądze w małżeństwie |
| 5 | all | Gdzie w domu chowa się pieniądze „na czarną godzinę”? |
| 6 | all | Na co warto odkładać pieniądze? |
| 7 | all | Pierwsza rzecz po wygraniu miliona złotych |
| 8 | all | Co najbardziej podrożało w ostatnich latach? |
| 9 | all | Na czym najłatwiej zaoszczędzić w domowym budżecie? |
| 10 | all | Komu najczęściej pożyczamy pieniądze? |
| 11 | wife | Na co mąż wydaje pieniądze bez sensu? |
| 12 | wife | Co mąż kupuje „bo było w promocji”? |
| 13 | wife | Czego mąż w domu nigdy nie wyrzuci? |
| 14 | wife | W jakim sklepie mąż może spędzić cały dzień? |
| 15 | wife | Co mąż robi, kiedy dostaje premię? |
| 16 | husband | Na co żona wydaje pieniądze bez sensu? |
| 17 | husband | Co żona kupuje „bo było w promocji”? |
| 18 | husband | Czego żona ma w domu za dużo? |
| 19 | husband | W jakim sklepie żona może spędzić cały dzień? |
| 20 | husband | Co żona robi, kiedy dostaje premię? |
| 21 | all | Rzecz, którą trzymamy w szufladzie, „bo się przyda” |
| 22 | all | Co dziecko najczęściej chce kupić przy kasie? |
| 23 | all | Czego szukamy w domu tuż przed wyjściem? |
| 24 | all | Za co dziecko może dostać kieszonkowe? |
| 25 | all | Najdziwniejszy prezent ślubny, jaki można dostać |
| 26 | all | Co robimy z drobnymi z portfela? |

Pytania mają być edytowalne w `/admin` (dodaj, zmień treść, ukryj, kolejność), zanim ruszy ankieta.

## Model danych (Supabase)

```sql
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default false,
  survey_open boolean not null default true,
  created_at timestamptz default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events on delete cascade,
  position int not null,
  audience text not null check (audience in ('all','wife','husband')),
  text text not null,
  hidden boolean not null default false
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events on delete cascade,
  device_id uuid not null,
  role text not null check (role in ('wife','husband')),
  created_at timestamptz default now(),
  unique (event_id, device_id)
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions on delete cascade,
  question_id uuid references questions on delete cascade,
  raw text not null,
  normalized text not null,           -- małe litery, bez ogonków i interpunkcji
  group_id uuid                       -- przypisana grupa (null = niepogrupowana)
);

create table answer_groups (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions on delete cascade,
  label text not null,                -- nazwa na tablicy, np. „Narzędzia”
  hidden boolean not null default false  -- np. odpowiedzi nieczytelne / żarty niecenzuralne
);

-- stan gry, żeby odświeżenie /tablica nic nie gubiło i dało się sterować z drugiego urządzenia
create table game_state (
  event_id uuid primary key references events on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
```

RLS włączone na wszystkich tabelach, bez polityk dla anon: cały dostęp przez serwer (service role) po sprawdzeniu PIN-u. Realtime tylko dla `game_state` i licznika zgłoszeń, przez kanał po stronie serwera albo przez polling co kilka sekund (prostsze i wystarczy).

## Panel prowadzącego (`/admin`)

Logowanie: pole PIN → httpOnly cookie z podpisanym tokenem (HMAC z `ADMIN_PIN`), ważne 24 h.

1. **Na żywo:** liczba zgłoszeń (żony / mężowie), odświeżana co kilka sekund. Przycisk „Zamknij ankietę” (`survey_open = false` → `/` pokazuje „Ankieta zamknięta”).
2. **Lista pytań:** liczba odpowiedzi i stan („niepogrupowane”, „pogrupowane”, „wybrane do gry”).
3. **Grupowanie jednego pytania:**
   - Automatyczne: przycisk „Pogrupuj z AI” wysyła do Claude listę unikalnych odpowiedzi (`normalized` + liczność) i treść pytania. Prompt prosi o JSON: `[{label, members:[normalized…]}]`, łączy synonimy i literówki („ciuchy”, „ubrania”, „bluzki” → „Ubrania”), etykiety po polsku, 1–3 słowa, z wielkiej litery. Odpowiedź waliduj (każdy `normalized` w dokładnie jednej grupie; brakujące → osobne grupy).
   - Ręczne poprawki: lista grup z licznikami i rozwijaną listą członków. Można przeciągnąć albo przenieść odpowiedź do innej grupy, scalić dwie grupy, zmienić etykietę, ukryć grupę.
   - Bez AI też musi działać: domyślnie grupuj po `normalized`.
4. **Wynik pytania:** top 6 grup, punkty = `round(liczba osób w grupie / liczba osób, które odpowiedziały na to pytanie × 100)`, posortowane malejąco. Podgląd dokładnie tak, jak będzie na tablicy.
5. **Wybór do gry:** prowadzący przypisuje pytania do rund 1–5 i 5 pytań do finału. Podpowiedź z dokumentu: runda 1 ogólne (np. 23), runda 2 „mężowie o żonach” (np. 16), runda 3 „żony o mężach” (np. 11), runda 4 o małżeństwie (np. 4), runda 5 na wesoło (np. 7), finał krótkie pytania z wyraźnym liderem.
6. **Eksport:** pobierz CSV z wynikami wszystkich pytań (kopia zapasowa na wypadek braku internetu wieczorem).

## Tablica (`/tablica`)

Przenieś wygląd i zachowanie z `tablica.html`: ciemna tablica, bursztynowe „LED-owe” litery (font VT323), drużyny **ŻONY** (różowa) i **MĘŻOWIE** (niebieska), pula na środku.

Gra:
- Runda 1–5, mnożnik ×1, ×1, ×1, ×2, ×3. Pytanie rundy pochodzi z przypisania w `/admin`.
- Zakryte pola z numerami 1–6; klik albo klawisz 1–6 odkrywa odpowiedź (animacja odwrócenia + dźwięk „ding” z Web Audio).
- Przycisk / klawisz **X**: duży czerwony X na całej tablicy na sekundę (dźwięk „buzz”), licznik X pod tablicą (max 3).
- „Pula dla Żon” / „Pula dla Mężów”: dodaje sumę odkrytych punktów × mnożnik do drużyny, odkrywa resztę.
- „Następne pytanie”: przechodzi do kolejnej rundy.
- „Wyzeruj wynik”: z potwierdzeniem drugim kliknięciem (bez `confirm()`).
- **H** chowa i pokazuje panel prowadzącego, żeby na rzutniku była sama tablica. Przycisk „Pełny ekran”.

Finał:
- 5 pytań finałowych, dwie kolumny: Osoba 1 i Osoba 2.
- Prowadzący przy każdym pytaniu wybiera z listy, którą odpowiedź podał gracz (albo „brak”). Osoba 2 nie może wybrać tej samej grupy co Osoba 1 (opcja zablokowana).
- Suma punktów obu osób i cel 200 (po osiągnięciu podświetlenie na zielono).
- Stoper 20 s i 25 s z dużymi cyframi i dźwiękiem na końcu.

Stan gry zapisuj w `game_state` (debounce ok. 300 ms), a po odświeżeniu strony odtwarzaj go. Opcjonalnie drugi widok `/tablica?pilot=1` na telefon prowadzącego, który steruje tą samą grą (wtedy `/tablica` na rzutniku słucha zmian `game_state`). To „nice to have”, nie blokuje wdrożenia.

## Kod QR (`/qr`)

Pełnoekranowy, czytelny z końca sali: duży kod QR (min. 60% wysokości ekranu) z linkiem do `/` (bazowy URL z `window.location.origin` albo zmiennej env), napis „Zeskanuj i zagraj!”, krótka instrukcja, link tekstowy pod kodem.

## Wygląd i jakość

- Polski interfejs, poprawne polskie znaki, wszystkie teksty po polsku.
- Ankieta: mobile first, czytelna na małym telefonie, kontrast, duże pola. Paleta spójna z prezentacjami rekolekcji: ciemna zieleń `#1F4A42`, złoto `#A97A3E`, jasne tło `#EEF3F1`, czcionki Cambria/Calibri lub ich webowe odpowiedniki.
- Tablica: ciemny motyw jak w prototypie, czytelność z 10 m na rzutniku.
- Bez `alert()`/`confirm()`/`prompt()`.
- Ankieta ma działać przy słabym zasięgu: jedno żądanie przy wysyłce, czytelny komunikat błędu i przycisk „Spróbuj ponownie” bez utraty wpisanych odpowiedzi (trzymaj je w localStorage do udanej wysyłki).

## Kryteria odbioru

1. Na telefonie: wejście z QR → wybór „Żona” → widzę pytania `wife` + `all` → wysyłam → ekran podziękowania; ponowne wejście → „Już odpowiedziałeś”.
2. To samo dla „Mąż” z pytaniami `husband` + `all`.
3. `/admin` bez PIN-u nie wpuszcza; z PIN-em pokazuje licznik zgłoszeń rosnący na żywo.
4. „Pogrupuj z AI” łączy „Ciuchy”, „ubrania!”, „Bluzki” w jedną grupę; ręcznie mogę przenieść odpowiedź między grupami i zmienić etykietę; bez klucza API grupowanie po `normalized` nadal działa.
5. Punkty na tablicy = procent osób, które odpowiedziały na dane pytanie, top 6, malejąco.
6. `/tablica`: odkrywanie 1–6, X, pule dla drużyn z mnożnikami ×2/×3 w rundach 4–5, finał z blokadą powtórzenia i stoperem; odświeżenie strony nie gubi stanu.
7. `/qr` wyświetla kod, który po zeskanowaniu otwiera ankietę.
8. Eksport CSV działa.
9. Dane z seeda (26 pytań) ładują się skryptem `npm run seed` albo migracją SQL.
10. README: jak ustawić zmienne środowiskowe, uruchomić migracje w Supabase, zrobić deploy na Vercel i przetestować całość w 5 minut.

## Kolejność prac

1. Schemat i seed w Supabase, Route Handlers do zapisu ankiety.
2. Ankieta `/` (mobile).
3. `/admin`: PIN, licznik, lista pytań, grupowanie po `normalized`, wynik pytania.
4. Grupowanie z AI + ręczne poprawki.
5. `/tablica` (port z `tablica.html`) z zapisem stanu w `game_state`.
6. `/qr`, eksport CSV, README, deploy.
7. Test end to end według kryteriów odbioru.

Termin: działająca wersja do soboty rano (ankieta zbierana w ciągu dnia, gra wieczorem).
