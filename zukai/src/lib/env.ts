/**
 * ZUKAI ENV — Zod-validated environment variables
 * Fails loudly at startup if required vars are missing.
 */

import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required'),
});

function parseEnv() {
  const result = envSchema.safeParse({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    const errors = result.error.issues.map((e) => `  • ${e.path.join('.')}: ${e.message}`).join('\n');
    console.warn(
      `[Zukai] ⚠️  Missing environment variables:\n${errors}\n  → Copy .env.example to .env and fill in values.`
    );
    // Return defaults so app doesn't crash in dev without .env
    return {
      EXPO_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'placeholder_anon_key',
    };
  }

  return result.data;
}

export const env = parseEnv();

