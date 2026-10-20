/**
 * Instrukcja dla prowadzącego Familiadę: strona /familiada/instrukcja (link z landingu i z pilota).
 * Nazwy przycisków muszą zgadzać się z tablicą i pilotem (src/components/board).
 */

export interface GuideSection {
  title: string;
  steps: string[];
}

/** Dwie najważniejsze rzeczy – wyróżnione na górze instrukcji. */
export const HOST_GUIDE_KEY_POINTS: GuideSection[] = [
  {
    title: "Pilnuj pilota",
    steps: [
      "Pilot to Twój telefon – całą grą sterujesz z niego, a sala patrzy tylko na rzutnik.",
      "Pilot otwierasz kodem QR z panelu i PIN-em prowadzącego. Nie pokazuj tego kodu ani PIN-u uczestnikom i nie oddawaj nikomu telefonu z otwartym pilotem.",
      "Na pilocie widzisz wszystkie odpowiedzi z punktami – trzymaj ekran tak, żeby gracze go nie widzieli.",
    ],
  },
  {
    title: "Pomyłka? Zawsze możesz dać „↶ Wstecz”",
    steps: [
      "„Wstecz” cofa ostatnią akcję: odkrytą odpowiedź, dany błąd, wybór drużyny, „Dalej” (także przyznaną pulę i przejście do kolejnej rundy) i wybory w finale.",
      "Możesz cofać wiele razy pod rząd – do 30 kroków wstecz. Historia przetrwa nawet odświeżenie strony.",
      "Odpowiedź odkrytą przez pomyłkę możesz też po prostu dotknąć jeszcze raz – zniknie z tablicy.",
    ],
  },
];

export const HOST_GUIDE: GuideSection[] = [
  {
    title: "Przed grą",
    steps: [
      "W panelu sprawdź plan rozgrywki: pytanie do każdej z 5 rund i 5 pytań finału.",
      "Przejrzyj odpowiedzi na tablicy w podglądzie – czy etykiety są krótkie i czy nic się nie powtarza. Popraw grupy ręcznie, jeśli trzeba.",
      "Podziel salę na dwie drużyny: ŻONY i MĘŻOWIE.",
    ],
  },
  {
    title: "Na sali",
    steps: [
      "Laptop z rzutnikiem: w panelu kliknij „Tablica ↗”, wpisz PIN, potem „Pełny ekran”.",
      "Kliknij raz w tablicę – przeglądarka włącza dźwięk dopiero po kliknięciu.",
      "„Ukryj panel” (albo klawisz H) chowa przyciski prowadzącego z rzutnika.",
      "Telefon: w panelu otwórz „Pilot”, zeskanuj kod QR i wpisz PIN. Telefon jest wyciszony – dźwięki gra tylko rzutnik.",
    ],
  },
  {
    title: "Rundy (5 pytań, w 4. rundzie punkty ×2, w 5. ×3)",
    steps: [
      "„Start ▶” – na tablicy plansza pierwszej rundy.",
      "„Dalej →” pokazuje pytanie na tablicy i odlicza 3 sekundy. Czytasz pytanie na głos.",
      "Pojedynek: po jednej osobie z drużyny, kto pierwszy, ten odpowiada. Drużyna z wyżej punktowaną odpowiedzią gra dalej.",
      "Dotknij pole drużyny u góry (ŻONY albo MĘŻOWIE) – ta drużyna odpowiada i do niej trafi pula.",
      "Trafiona odpowiedź: dotknij ją na liście – odkryje się na tablicy i doda do puli.",
      "Zła odpowiedź: „✗ Błąd” – na tablicy duży X i brzęczyk. Przy trzecim błędzie drużyna traci prawo do odpowiedzi.",
      "Przejęcie: dotknij pole drugiej drużyny. Ma jedną próbę – jeśli trafi, pula jest jej; jeśli nie, dotknij z powrotem pierwszą drużynę.",
      "„Pokaż” odsłania od dołu nieodgadnięte odpowiedzi – bez punktów, na koniec rundy.",
      "„Dalej →” przyznaje pulę zaznaczonej drużynie i przechodzi do następnej rundy.",
    ],
  },
  {
    title: "Podsumowanie",
    steps: [
      "Po 5. rundzie „Dalej →” pokazuje wyniki obu drużyn i zwycięzcę. Zwycięska drużyna wybiera dwie osoby do finału.",
      "Kolejne „Dalej →” rozpoczyna finał.",
    ],
  },
  {
    title: "Finał (5 pytań, cel: 200 punktów)",
    steps: [
      "Osoba 2 wychodzi z sali albo zakłada słuchawki, żeby nie słyszeć odpowiedzi osoby 1.",
      "„Dalej →” uruchamia 20 sekund dla osoby 1 i pokazuje pierwsze pytanie. Czytasz pytania szybko, po kolei.",
      "Na pilocie dotknij odpowiedź, która pasuje do tego, co powiedziała osoba – albo „✗ Błędna”. Pilot sam przechodzi do następnego pytania. Odpowiedzi nie widać na tablicy, dopóki ich nie odkryjesz.",
      "Po czasie „Dalej →” odkrywa odpowiedzi osoby 1 po kolei, z punktami.",
      "Osoba 2 wraca i ma 25 sekund. Nie może powtórzyć odpowiedzi osoby 1 – na pilocie jest ona zablokowana („os. 1”), poproś wtedy o inną odpowiedź.",
      "„Dalej →” odkrywa odpowiedzi osoby 2. Jeśli razem jest co najmniej 200 punktów – drużyna wygrywa finał.",
      "Ostatnie „Dalej →” pokazuje ekran „Dziękujemy!” z logami organizatorów.",
    ],
  },
  {
    title: "Gdy coś pójdzie nie tak",
    steps: [
      "Odśwież stronę – stan gry jest zapisany, nic nie zginie, stoper liczy dalej.",
      "Pod „Dalej” zawsze widzisz, co zrobi następne kliknięcie.",
      "Poprawki w panelu (grupy odpowiedzi, wybór pytań) wczytają się na tablicę przy najbliższym „Dalej”.",
    ],
  },
];
