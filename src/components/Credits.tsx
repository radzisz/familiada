import Image from "next/image";
import { OPERATOR, VENDOR } from "@/lib/credits";

/** Stopka „Operator: Fundacja YoungTree · Dostawca systemu: PoleForce”. `onDark` – jasny tekst na ciemnym tle. */
export function Credits({ onDark = false }: { onDark?: boolean }) {
  return (
    <p className={`credits${onDark ? " on-dark" : ""}`}>
      <span>Operator:</span>
      <a href={OPERATOR.href} target="_blank" rel="noopener noreferrer">
        <Image src={OPERATOR.logo} alt="" width={20} height={20} />
        {OPERATOR.name}
      </a>
      <span aria-hidden="true">·</span>
      <span>Dostawca systemu:</span>
      <a href={VENDOR.href} target="_blank" rel="noopener noreferrer">{VENDOR.name}</a>
    </p>
  );
}
