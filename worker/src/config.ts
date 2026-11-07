import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  SUPABASE_URL: z.string().url().default('http://127.0.0.1:54321'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('mock-service-role-key'),
  GEMINI_API_KEY: z.string().optional(),
  POLL_INTERVAL_MS: z.coerce.number().default(3000),
});

export const config = envSchema.parse({
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  POLL_INTERVAL_MS: process.env.POLL_INTERVAL_MS,
});

