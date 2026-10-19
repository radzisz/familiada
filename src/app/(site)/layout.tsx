import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { SITE_METADATA } from "@/lib/siteMetadata";
import "@/components/site/site.css";

export const metadata = SITE_METADATA;

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
