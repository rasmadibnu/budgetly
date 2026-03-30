import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AUTH_SESSION_SECRET: z.string().min(32),
  AI_API_BASE_URL: z.string().url().default("https://ai.rasmadibnu.com"),
  AI_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().default("gemini-3-flash"),
  APP_HOUSEHOLD_NAME: z.string().default("Budgetly Household")
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET,
  AI_API_BASE_URL: process.env.AI_API_BASE_URL,
  AI_API_KEY: process.env.AI_API_KEY,
  AI_MODEL: process.env.AI_MODEL,
  APP_HOUSEHOLD_NAME: process.env.APP_HOUSEHOLD_NAME
});
