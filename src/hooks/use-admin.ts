import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { AwardEvent, EventStatus } from "@/lib/types"

export type AdminEventRow = AwardEvent & { nominations: { count: number }[] }

export function useAdminEvents() {
  return useQuery({
    queryKey: ["admin", "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, nominations(count)")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as AdminEventRow[]
    },
  })
}

export function useAdminEvent(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "event", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id!)
        .single()
      if (error) throw error
      return data as AwardEvent
    },
  })
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { title: string; slug: string }) => {
      const { data, error } = await supabase
        .from("events")
        .insert({ title: input.title, slug: input.slug })
        .select()
        .single()
      if (error) throw error
      return data as AwardEvent
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "events"] }),
  })
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<AwardEvent>) => {
      const { data, error } = await supabase
        .from("events")
        .update(patch)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data as AwardEvent
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin"] })
      qc.invalidateQueries({ queryKey: ["event", "slug", data.slug] })
      qc.invalidateQueries({ queryKey: ["events"] })
    },
  })
}

export function useSetEventStatus(id: string) {
  const update = useUpdateEvent(id)
  return {
    ...update,
    setStatus: (status: EventStatus) => update.mutateAsync({ status }),
  }
}
