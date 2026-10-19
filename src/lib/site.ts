/**
 * Strona Animatorni: nazwa platformy i opisy narzędzi. Jedyne miejsce do edycji treści landingów –
 * strona zbiorcza (`/`) i strony narzędzi (`/familiada`, `/ankiety`, `/spiewnik`) czytają stąd.
 */

export const PLATFORM = {
  name: "Animatornia",
  domain: "animatornia.pl",
  tagline: "Narzędzia dla prowadzących wydarzenia, wyjazdy i rekolekcje",
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
  steps: ToolFeature[];
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
        "W ciągu dnia uczestnicy odpowiadają na pytania w telefonie, wieczorem gracie na rzutniku. " +
        "Odpowiedzi same się policzą i pogrupują – bez kartek i bez liczenia do północy.",
    },
    features: [
      { title: "Ankieta przez kod QR", text: "Uczestnicy skanują kod i odpowiadają w telefonie. Bez aplikacji i bez zakładania kont." },
      { title: "Liczy i grupuje za Ciebie", text: "„Pieniądze”, „kasa” i „pieniadze” trafią do jednej odpowiedzi. Sztuczna inteligencja łączy synonimy i literówki." },
      { title: "Prawdziwa tablica", text: "Tablica jak w telewizji, z punktami, błędami, pulą i finałem ze stoperem. Wyświetlasz ją na rzutniku albo telewizorze." },
      { title: "Pilot w telefonie", text: "Prowadzisz grę z telefonu: odkrywasz odpowiedzi, dajesz błędy, przechodzisz do kolejnej rundy." },
      { title: "Własne pytania", text: "Gotowy zestaw pytań na start albo Twoje własne – pod temat rekolekcji, wyjazdu czy integracji." },
      { title: "Twoja oprawa", text: "Nazwa wydarzenia i logo organizatora na tablicy i w ankiecie." },
    ],
    steps: [
      { title: "Rano", text: "Wyświetlasz kod QR, uczestnicy odpowiadają na kilkanaście krótkich pytań." },
      { title: "Po południu", text: "Odpowiedzi są już policzone. Wybierasz pytania do rund i finału – ręcznie albo jednym kliknięciem." },
      { title: "Wieczorem", text: "Dzielisz salę na drużyny i gracie. Ty masz pilota w telefonie, wszyscy patrzą na tablicę." },
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
