import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv, type Database } from "./env";

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient<Database>(url, anonKey);
}
