import { localStore } from "./localStore";
import { supabaseStore } from "./supabaseStore";
import { usingSupabase } from "./storeConfig";

export const store = usingSupabase ? supabaseStore : localStore;
export { usingSupabase };
