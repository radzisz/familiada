import { SurveyMessage } from "@/components/survey/SurveyMessage";

/** Ankieta ma adres z id rozgrywki (`/ankieta/<id>`) – sama strona główna tylko kieruje do kodu QR. */
export default function HomePage() {
  return <SurveyMessage title="Zeskanuj kod QR" text="Link do ankiety dostaniesz od prowadzącego – zeskanuj kod QR wyświetlony na sali." />;
}
