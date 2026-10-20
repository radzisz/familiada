/**
 * Strona Animatorni: nazwa platformy i opisy narzędzi. Jedyne miejsce do edycji treści landingów –
 * strona zbiorcza (`/`) i strony narzędzi (`/familiada`, `/ankiety`, `/spiewnik`) czytają stąd.
 */

export const PLATFORM = {
  name: "Animatornia",
  domain: "animatornia.pl",
  tagline: "Katalog narzędzi dla prowadzących wydarzenia, wyjazdy i rekolekcje",
} as const;

export type ToolSlug = "familiada" | "ankiety" | "spiewnik";

export interface ToolFeature { title: string; text: string }

export interface Tool {
  slug: ToolSlug;
  name: string;
  /** Jedno zdanie na kartę narzędzia na stronie zbiorczej. */
  short: string;
  /** „Wkrótce” – landing zbiera chętnych zamiast obiecywać gotowy produkt. */
  soon?: boolean;
  /** Kolor wiodący narzędzia (karta, akcenty landingu). */
  accent: string;
  /** Kiedy w czasie wydarzenia narzędzie się przydaje. */
  moment: string;
  hero: { title: string; lead: string };
  features: ToolFeature[];
  steps?: ToolFeature[];
  /** Kroki pogrupowane w etapy (np. przygotowanie i gra) – zastępują `steps` w „Jak to działa”. */
  stages?: { title: string; steps: ToolFeature[] }[];
  /** Strona z instrukcją dla prowadzącego (link pod „Jak to działa”). */
  guide?: string;
  audience: string[];
  faq: { q: string; a: string }[];
}

export const TOOLS: Tool[] = [
  {
    slug: "familiada",
    name: "Familiada",
    short: "Gra na rzutniku z odpowiedziami Twoich uczestników – zebranymi telefonem i policzonymi automatycznie.",
    accent: "#E0961A",
    moment: "Wieczór",
    hero: {
      title: "Familiada z odpowiedziami Twojej grupy",
      lead:
        "Przygotowujesz pytania – własne albo z pomocą AI – i pytasz o nie uczestników przez telefon. " +
        "Odpowiedzi same się policzą i pogrupują, a potem gracie jak w telewizji: tablica na rzutniku, pilot w Twoim telefonie.",
    },
    features: [
      { title: "Pytania własne lub z AI", text: "Wpisujesz swoje pytania albo wybierasz temat, a AI proponuje pytania – pod rekolekcje, wyjazd czy integrację." },
      { title: "Plakat z kodem QR", text: "Platforma generuje plakat do wydrukowania i link do wysłania. Uczestnicy odpowiadają w telefonie, bez aplikacji i kont." },
      { title: "Liczy i grupuje za Ciebie", text: "„Pieniądze”, „kasa” i „pieniadze” trafią do jednej odpowiedzi. AI łączy synonimy i literówki, a Ty możesz poprawić grupy ręcznie." },
      { title: "Brakuje odpowiedzi? Dogeneruj", text: "Gdy na pytanie odpowiedziało niewiele osób, AI podpowie dodatkowe odpowiedzi, żeby tablica była pełna." },
      { title: "Prawdziwa tablica", text: "Rozgrywka jak w telewizji: rundy, punkty, błędy, pula i finał ze stoperem. Wyświetlasz ją na rzutniku albo telewizorze." },
      { title: "Pilot w telefonie", text: "Prowadzisz grę z telefonu: odkrywasz odpowiedzi, dajesz błędy, przechodzisz do kolejnej rundy." },
    ],
    guide: "/familiada/instrukcja",
    stages: [
      {
        title: "Etap I – przygotowanie",
        steps: [
          { title: "Pytania", text: "Wpisujesz własne pytania albo wybierasz temat i generujesz je przez AI." },
          { title: "Pytasz uczestników", text: "Wieszasz plakat z kodem QR wygenerowany przez platformę albo wysyłasz uczestnikom link. Odpowiadają w telefonie." },
          { title: "Opracowujesz odpowiedzi", text: "AI grupuje podobne odpowiedzi, Ty możesz to poprawić ręcznie. Jeśli odpowiedzi jest mało – dogenerujesz dodatkowe." },
        ],
      },
      {
        title: "Etap II – gra",
        steps: [
          { title: "Tablica na rzutniku", text: "Gracie zgodnie z oryginalnym, telewizyjnym scenariuszem: drużyny, rundy, pula i finał. Wszyscy patrzą na tablicę." },
          { title: "Pilot w telefonie", text: "Ty prowadzisz grę z aplikacji w telefonie – odkrywasz odpowiedzi, liczysz błędy i przełączasz rundy." },
        ],
      },
    ],
    audience: ["rekolekcje i dni skupienia", "obozy, kolonie i wyjazdy", "integracje firmowe", "wesela i rodzinne zjazdy"],
    faq: [
      { q: "Ilu uczestników potrzeba?", a: "Gra ma sens już od kilkunastu osób – im więcej odpowiedzi, tym ciekawsze wyniki." },
      { q: "Czego potrzebuję na sali?", a: "Rzutnika lub telewizora z przeglądarką i internetu. Uczestnicy używają własnych telefonów." },
      { q: "Czy ankieta jest anonimowa?", a: "Tak. Nie zbieramy imion ani adresów – tylko odpowiedzi na pytania." },
    ],
  },
  {
    slug: "ankiety",
    name: "Ankiety i opinie",
    short: "Opinie uczestników po wydarzeniu i gotowy raport dla organizatorów – w kilka minut, nie w kilka wieczorów.",
    accent: "#2C7A6B",
    moment: "Po wydarzeniu",
    hero: {
      title: "Dowiedz się, co naprawdę zostało w uczestnikach",
      lead:
        "Krótka, anonimowa ankieta w telefonie na koniec wydarzenia. Ty dostajesz średnie, rozkłady ocen, " +
        "wszystkie odpowiedzi otwarte i raport do wydrukowania dla organizatorów.",
    },
    features: [
      { title: "Jedno pytanie na ekran", text: "Wygodnie na telefonie, z cofaniem i paskiem postępu. Wypełnienie zajmuje około 3 minut." },
      { title: "Oceny i pytania otwarte", text: "Skale ocen dla każdego punktu programu i miejsce na własne słowa uczestników." },
      { title: "Wskaźnik poleceń (NPS)", text: "Jedno pytanie, które mówi najwięcej: czy poleciliby wydarzenie znajomym." },
      { title: "Raport dla organizatorów", text: "Wykresy, średnie i rozkłady na jednej stronie – zapisujesz jako PDF i wysyłasz." },
      { title: "Podsumowanie AI", text: "Najczęstsze wątki z odpowiedzi otwartych zebrane w kilka akapitów." },
      { title: "Kontakt po ankiecie", text: "Chętni zostawiają e-mail na przyszłość – osobno, więc ankieta zostaje anonimowa." },
    ],
    steps: [
      { title: "Przed", text: "Dopasowujesz pytania do programu: wykłady, prowadzący, warsztaty, wieczory." },
      { title: "Na zakończenie", text: "Wyświetlasz kod QR – uczestnicy wypełniają ankietę, zanim rozjadą się do domów." },
      { title: "Następnego dnia", text: "Przeglądasz wyniki i wysyłasz organizatorom gotowy raport." },
    ],
    audience: ["rekolekcje i wspólnoty", "szkolenia i warsztaty", "obozy i kolonie (opinie rodziców i uczestników)", "konferencje"],
    faq: [
      { q: "Czy mogę zmienić pytania?", a: "Tak, ankieta jest dopasowana do Twojego wydarzenia." },
      { q: "Czy ankieta jest anonimowa?", a: "Tak. Kontakt jest dobrowolny i zapisywany osobno, bez powiązania z odpowiedziami." },
      { q: "Czy dostanę dane do Excela?", a: "Tak, wszystkie odpowiedzi pobierzesz jako plik CSV." },
    ],
  },
  {
    slug: "spiewnik",
    name: "Śpiewnik",
    short: "Teksty i akordy na telefonach uczestników i na rzutniku. Prowadzący przełącza pieśni – wszyscy śpiewają z tej samej strony.",
    soon: true,
    accent: "#9B3B4E",
    moment: "Cały czas",
    hero: {
      title: "Wszyscy śpiewają z tej samej strony",
      lead:
        "Koniec z kserowanymi śpiewnikami i szukaniem „która to zwrotka”. Prowadzący wybiera pieśń, " +
        "a tekst pojawia się na rzutniku i w telefonach uczestników. Gitarzysta widzi akordy.",
    },
    features: [
      { title: "Tekst na rzutniku", text: "Duże litery, zwrotka po zwrotce – przełączasz z telefonu." },
      { title: "Tekst w telefonach", text: "Uczestnicy skanują kod QR i widzą tę samą pieśń, nawet z końca sali czy przy ognisku." },
      { title: "Akordy dla muzyków", text: "Widok z akordami i transpozycją dla gitary i scholi." },
      { title: "Program na wydarzenie", text: "Układasz listę pieśni na Mszę, adorację czy wieczór przy ognisku." },
    ],
    steps: [
      { title: "Przed", text: "Wybierasz pieśni i układasz je w kolejności." },
      { title: "W trakcie", text: "Przełączasz pieśni i zwrotki z telefonu – rzutnik i telefony nadążają same." },
      { title: "Po", text: "Lista pieśni zostaje na kolejne wydarzenie." },
    ],
    audience: ["schole i zespoły", "rekolekcje, oazy i adoracje", "obozy i ogniska", "wspólnoty i duszpasterstwa"],
    faq: [
      { q: "Kiedy będzie dostępny?", a: "Pracujemy nad nim. Zostaw kontakt – odezwiemy się, gdy ruszy, i chętnie zapytamy, czego potrzebujesz." },
    ],
  },
];

export function toolBySlug(slug: ToolSlug): Tool {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Nieznane narzędzie: ${slug}`);
  return tool;
}

/** Katalog narzędzi: nasze (landing w Animatorni) i polecane cudze (link na zewnątrz). Kolejność = kolejność na stronie. */
export interface CatalogEntry {
  name: string;
  short: string;
  /** Nasze narzędzie – prowadzi na jego landing. */
  tool?: ToolSlug;
  /** Strona narzędzia spoza Animatorni. */
  url?: string;
  /** Nasze narzędzie z własną stroną (bez landingu w Animatorni). */
  own?: boolean;
}

export const CATALOG: CatalogEntry[] = [
  ...TOOLS.map((t): CatalogEntry => ({ name: t.name, short: t.short, tool: t.slug })),
  {
    name: "Rekolekcje Oazowe", url: "https://rekolekcje.oazowe.pl", own: true,
    short: "Zapisy na rekolekcje oazowe: formularz dla uczestników, płatności, karty uczestnika i listy obecności dla moderatorów.",
  },
  { name: "CampsFlow", url: "https://campsflow.pl", own: true, short: "Zapisy i rezerwacje na obozy, kolonie i wyjazdy: formularze, płatności, umowy, listy uczestników." },
  { name: "Kahoot!", url: "https://kahoot.com", short: "Quizy na żywo – pytania na ekranie, uczestnicy odpowiadają w telefonach na czas." },
  { name: "Wordwall", url: "https://wordwall.net/pl", short: "Gotowe szablony gier i ćwiczeń: koło fortuny, krzyżówki, dopasowania." },
  { name: "Mentimeter", url: "https://www.mentimeter.com", short: "Pytania do sali z wynikami na żywo: chmura słów, skale, głosowania." },
  { name: "Slido", url: "https://www.slido.com", short: "Pytania od uczestników do prelegenta i szybkie sondy podczas spotkania." },
  { name: "Formularze Google", url: "https://www.google.com/forms/about/", short: "Proste formularze i ankiety z wynikami w arkuszu." },
  { name: "Brewiarz.pl", url: "https://brewiarz.pl", short: "Liturgia godzin i czytania na każdy dzień – w telefonie i do wyświetlenia na rzutniku." },
  { name: "Doodle", url: "https://doodle.com", short: "Wybór terminu spotkania, który pasuje większości." },
  { name: "Canva", url: "https://www.canva.com", short: "Plakaty, zaproszenia i grafiki do mediów społecznościowych z gotowych szablonów." },
];
