import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  return {
    reactStrictMode: true,
    // `next dev` pisze do .next-dev, żeby nie kolidować z `next build`/`next start` w .next
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    serverExternalPackages: ["@react-pdf/renderer"],
    // Raport PDF czyta fonty i loga z dysku – muszą trafić do funkcji na Vercelu.
    outputFileTracingIncludes: { "/api/admin/opinie/raport": ["./src/assets/fonts/*.ttf", "./public/logos/*"] },
  };
}
