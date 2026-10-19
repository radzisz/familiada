import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import "@/components/site/site.css";

/** Strona Animatorni: strona zbiorcza i landingi narzędzi (bez panelu, ankiet i tablicy). */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="st">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
