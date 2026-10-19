import type { MetadataRoute } from "next";
import { PLATFORM } from "@/lib/site";

/** Indeksujemy tylko stronę Animatorni – panel, ankiety, tablice i API zostają poza wyszukiwarką. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/ankieta", "/tablica", "/qr", "/opinie"] },
    sitemap: `https://${PLATFORM.domain}/sitemap.xml`,
  };
}
