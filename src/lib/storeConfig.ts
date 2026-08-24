export const PLACEHOLDER_URL = "https://placeholder.supabase.co";
export const PLACEHOLDER_ANON_KEY = "placeholder-anon-key";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const usingSupabase = Boolean(
  url && anonKey && url !== PLACEHOLDER_URL && anonKey !== PLACEHOLDER_ANON_KEY
);
