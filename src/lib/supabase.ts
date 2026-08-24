import { createClient } from "@supabase/supabase-js";
import { PLACEHOLDER_ANON_KEY, PLACEHOLDER_URL } from "./storeConfig";

const url = import.meta.env.VITE_SUPABASE_URL || PLACEHOLDER_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || PLACEHOLDER_ANON_KEY;

export const supabase = createClient(url, anonKey);
