import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env.local and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart the dev server.",
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)

const PAGE_SIZE = 1000

/**
 * PostgREST caps every response at 1000 rows by default and truncates silently.
 * Fetches all rows page by page. The query must have a stable, unique order
 * (e.g. `.order("id")`) so pages don't overlap or skip rows.
 */
export async function fetchAllRows<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

/**
 * Pings the project's REST root to verify the URL and key are both valid.
 * Doesn't depend on any table existing.
 */
export async function checkSupabaseConnection() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { apikey: supabasePublishableKey },
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  return true
}
