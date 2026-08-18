import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env.local and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.",
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Pings the project's REST root to verify the URL and key are both valid.
 * Doesn't depend on any table existing.
 */
export async function checkSupabaseConnection() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { apikey: supabaseAnonKey },
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  return true
}
