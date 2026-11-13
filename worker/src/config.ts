import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  SUPABASE_URL: z.string().url().default('http://127.0.0.1:54321'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  GEMINI_API_KEY: z.string().optional(),
  CONCURRENCY: z.coerce.number().default(2),
  POLL_INTERVAL_MS: z.coerce.number().default(3000),
  HEARTBEAT_INTERVAL_MS: z.coerce.number().default(30000),
  VISIBILITY_TIMEOUT_SECONDS: z.coerce.number().default(600),
  MAX_RETRIES: z.coerce.number().default(3),
  
  // Cost & model limits
  GEMINI_OUTLINE_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_SCRIPT_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_OCR_MODEL: z.string().default('gemini-2.5-flash'),

  // Step timeouts (ms)
  TIMEOUT_EXTRACTION_MS: z.coerce.number().default(45000),
  TIMEOUT_SCRIPTING_MS: z.coerce.number().default(90000),
  TIMEOUT_VOICING_MS: z.coerce.number().default(120000),
  TIMEOUT_ASSEMBLY_MS: z.coerce.number().default(60000),

  // Plan limits (enforced server-side)
  MAX_PAGES_FREE: z.coerce.number().default(20),
  MAX_PAGES_PRO: z.coerce.number().default(150),
  MAX_WORDS_FREE: z.coerce.number().default(8000),
  MAX_WORDS_PRO: z.coerce.number().default(60000),
});

export const config = envSchema.parse({
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CONCURRENCY: process.env.CONCURRENCY,
  POLL_INTERVAL_MS: process.env.POLL_INTERVAL_MS,
  HEARTBEAT_INTERVAL_MS: process.env.HEARTBEAT_INTERVAL_MS,
  VISIBILITY_TIMEOUT_SECONDS: process.env.VISIBILITY_TIMEOUT_SECONDS,
  MAX_RETRIES: process.env.MAX_RETRIES,
  GEMINI_OUTLINE_MODEL: process.env.GEMINI_OUTLINE_MODEL,
  GEMINI_SCRIPT_MODEL: process.env.GEMINI_SCRIPT_MODEL,
  GEMINI_OCR_MODEL: process.env.GEMINI_OCR_MODEL,
  TIMEOUT_EXTRACTION_MS: process.env.TIMEOUT_EXTRACTION_MS,
  TIMEOUT_SCRIPTING_MS: process.env.TIMEOUT_SCRIPTING_MS,
  TIMEOUT_VOICING_MS: process.env.TIMEOUT_VOICING_MS,
  TIMEOUT_ASSEMBLY_MS: process.env.TIMEOUT_ASSEMBLY_MS,
  MAX_PAGES_FREE: process.env.MAX_PAGES_FREE,
  MAX_PAGES_PRO: process.env.MAX_PAGES_PRO,
  MAX_WORDS_FREE: process.env.MAX_WORDS_FREE,
  MAX_WORDS_PRO: process.env.MAX_WORDS_PRO,
});

// Voice mapping specifications
export const VOICE_CONFIG = {
  alloy: { name: 'Puck', speed: 1.0, gender: 'neutral' },
  echo: { name: 'Charon', speed: 1.0, gender: 'male' },
  fable: { name: 'Kore', speed: 1.0, gender: 'female' },
  onyx: { name: 'Fenrir', speed: 1.0, gender: 'deep_male' },
  nova: { name: 'Aoede', speed: 1.0, gender: 'female' },
  shimmer: { name: 'Leda', speed: 1.0, gender: 'warm_female' },
} as const;

export type VoiceId = keyof typeof VOICE_CONFIG;
