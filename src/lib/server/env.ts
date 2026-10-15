import "server-only";

function read(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Brak zmiennej środowiskowej ${name}`);
  return value;
}

export const env = {
  supabaseUrl: () => read("NEXT_PUBLIC_SUPABASE_URL"),
  serviceRoleKey: () => read("SUPABASE_SERVICE_ROLE_KEY"),
  adminPin: () => read("ADMIN_PIN"),
  /** Klucz Anthropic jest opcjonalny – bez niego działa grupowanie po `normalized`. */
  anthropicKey: (): string | null => process.env.ANTHROPIC_API_KEY || null,
  anthropicModel: () => process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
};
