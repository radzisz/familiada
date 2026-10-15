"use client";

import type { Audience } from "@/lib/types";

export function AudienceSelect({ value, onChange }: { value: Audience; onChange: (a: Audience) => void }) {
  return (
    <select aria-label="Kto odpowiada" value={value} onChange={(e) => onChange(e.target.value as Audience)}>
      <option value="all">wszyscy</option>
      <option value="wife">żony (zgadują mężowie)</option>
      <option value="husband">mężowie (zgadują żony)</option>
    </select>
  );
}
