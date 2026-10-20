import type { MetadataRoute } from "next";
import { PLATFORM, TOOLS } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${PLATFORM.domain}`;
  return [
    { url: base, priority: 1 },
    { url: `${base}/narzedzia`, priority: 0.9 },
    { url: `${base}/wspolpraca`, priority: 0.6 },
    ...TOOLS.map((t) => ({ url: `${base}/${t.slug}`, priority: 0.8 })),
  ];
}
