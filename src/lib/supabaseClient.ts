import { createClient } from "@supabase/supabase-js";

// Read environment variables (supports Next.js NEXT_PUBLIC_* and Vite VITE_*)
const rawSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

// Normalize Supabase URL (formats 'project-id' into 'https://project-id.supabase.co' if needed)
const normalizeSupabaseUrl = (url?: string): string => {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}.supabase.co`;
};

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL) and NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY) in your .env.local file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
