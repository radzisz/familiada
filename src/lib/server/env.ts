import "server-only";

/** Pierwsza ustawiona zmienna z listy (integracja Supabase w Vercel używa różnych nazw). */
function read(...names: string[]): string {
  const value = names.map((n) => process.env[n]).find((v) => v);
  if (!value) throw new Error(`Brak zmiennej środowiskowej ${names.join(" / ")}`);
  return value;
}

export const env = {
  supabaseUrl: () => read("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"),
  serviceRoleKey: () => read("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"),
  adminPin: () => read("ADMIN_PIN"),
  /** Klucz Anthropic jest opcjonalny – bez niego działa grupowanie po `normalized`. */
  anthropicKey: (): string | null => process.env.ANTHROPIC_API_KEY || null,
  anthropicModel: () => process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
};
