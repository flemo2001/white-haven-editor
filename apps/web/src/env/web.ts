// WHC fork — env schema gutted to only require the bare minimum for the
// stripped build (auth/db/marble/freesound were removed from this fork).
// 2026-06-12. If we re-enable auth or sounds later, restore the relevant
// fields from upstream's classic env/web.ts.
import { z } from "zod";

const webEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ANALYZE: z.string().optional(),
  NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("https://white-haven-editor.vercel.app"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const webEnv = webEnvSchema.parse(process.env);
