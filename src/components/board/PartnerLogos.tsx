import Image from "next/image";
import type { Partner } from "@/lib/branding";

/** Loga organizatorów w białych krążkach (ekran startowy i końcowy tablicy). */
export function PartnerLogos({ partners, names, className }: { partners: Partner[]; names: boolean; className?: string }) {
  return (
    <ul className={`tb-thanks-logos${className ? ` ${className}` : ""}`}>
      {partners.map((p) => (
        <li key={p.name}>
          <span className={`tb-thanks-disc${p.fill ? " fill" : ""}`}>
            <Image src={p.src} alt={`Logo: ${p.name}`} width={240} height={240} priority unoptimized={p.src.startsWith("data:")} />
          </span>
          {names && <span className="tb-thanks-name">{p.name}</span>}
        </li>
      ))}
    </ul>
  );
}
