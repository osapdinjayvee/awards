import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  AwardEvent,
  CategoryWithCriteria,
  RosterPerson,
  Unit,
} from "@/lib/types"

/** Public: event by slug with categories + criteria nested. */
export function useEventBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["event", "slug", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, award_categories(*, criteria(*))")
        .eq("slug", slug!)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const { award_categories, ...event } = data as AwardEvent & {
        award_categories: CategoryWithCriteria[]
      }
      const categories = [...award_categories]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((c) => ({
          ...c,
          criteria: [...c.criteria].sort((a, b) => a.sort_order - b.sort_order),
        }))
      return { event: event as AwardEvent, categories }
    },
  })
}

/** Public: open events list for the index page. */
export function useOpenEvents() {
  return useQuery({
    queryKey: ["events", "open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as AwardEvent[]
    },
  })
}

/** Public: roster for an event (for the nominee combobox). */
export function useRoster(eventId: string | undefined) {
  return useQuery({
    queryKey: ["roster", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roster_people")
        .select("*")
        .eq("event_id", eventId!)
        .order("full_name")
      if (error) throw error
      return data as RosterPerson[]
    },
  })
}

/** Public: units for an event (team categories). */
export function useUnits(eventId: string | undefined) {
  return useQuery({
    queryKey: ["units", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("event_id", eventId!)
        .order("name")
      if (error) throw error
      return data as Unit[]
    },
  })
}
