import type { Metadata, Viewport } from "next";
import { Caladea, Carlito, Rubik, VT323 } from "next/font/google";
import "./globals.css";

const caladea = Caladea({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-serif" });
const carlito = Carlito({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-sans" });
const vt323 = VT323({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-led" });
const rubik = Rubik({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "800"], variable: "--font-ui" });

export const metadata: Metadata = {
  title: "Familiada małżeńska",
  description: "Ankieta i tablica do Familiady na rekolekcjach dla małżeństw",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fonts = [caladea.variable, carlito.variable, vt323.variable, rubik.variable].join(" ");
  return (
    <html lang="pl" className={fonts}>
      <body>{children}</body>
    </html>
  );
}
