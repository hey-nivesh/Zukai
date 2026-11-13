/**
 * ZUKAI ENV — Zod-validated environment variables
 * Fails loudly at startup if required vars are missing.
 */

import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required'),
});

const FALLBACK_SUPABASE_URL = 'https://zyhrqnwzahfkhskwuqbf.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5aHJxbnd6YWhma2hza3d1cWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNjgxNTEsImV4cCI6MjEwOTY0NDE1MX0.CA7hAM8rUhx5SoM4lgH2MIOEVbraOjV5JlKxPjlCD7M';

function parseEnv() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

  const result = envSchema.safeParse({
    EXPO_PUBLIC_SUPABASE_URL: url,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  });

  if (!result.success) {
    const errors = result.error.issues.map((e) => `  • ${e.path.join('.')}: ${e.message}`).join('\n');
    console.warn(
      `[Zukai] ⚠️  Missing environment variables:\n${errors}\n  → Falling back to default project credentials.`
    );
    return {
      EXPO_PUBLIC_SUPABASE_URL: FALLBACK_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: FALLBACK_SUPABASE_ANON_KEY,
    };
  }

  return result.data;
}

export const env = parseEnv();

