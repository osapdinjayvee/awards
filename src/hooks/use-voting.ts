import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { EmploymentGroup, VoteCount, VotedEntry } from "@/lib/types"

export interface VerifyResult {
  voter_id: string
  full_name: string
  voted: VotedEntry[]
}

/** Known RPC error tokens -> human copy. */
export function votingErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes("not_authorized"))
    return "We couldn't find you on the voter list. Check your ID number and full name."
  if (msg.includes("too_many_attempts"))
    return "Too many failed attempts. Please wait 10 minutes and try again."
  if (msg.includes("already_voted"))
    return "You have already voted in this section."
  if (msg.includes("event_closed")) return "Voting for this event is closed."
  if (msg.includes("invalid_id")) return "Please enter your ID number."
  if (
    msg.includes("invalid_vote") ||
    msg.includes("invalid_nominee") ||
    msg.includes("invalid_section") ||
    msg.includes("invalid_category")
  )
    return "That vote isn't valid for this section. Refresh the page and try again."
  return "Something went wrong. Please try again."
}

export function useVerifyVoter(eventId: string) {
  return useMutation({
    mutationFn: async (input: { idNumber: string; name: string }) => {
      const { data, error } = await supabase.rpc("verify_voter", {
        p_event_id: eventId,
        p_id_number: input.idNumber,
        p_name: input.name,
      })
      if (error) throw new Error(error.message)
      return data as unknown as VerifyResult
    },
  })
}

export function useCastVote(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      categoryId: string
      section: EmploymentGroup | null
      idNumber: string
      name: string
      nomineePersonId: string | null
      nomineeUnitId: string | null
    }) => {
      const { error } = await supabase.rpc("cast_vote", {
        p_event_id: eventId,
        p_category_id: input.categoryId,
        p_section: input.section,
        p_id_number: input.idNumber,
        p_name: input.name,
        p_nominee_person_id: input.nomineePersonId,
        p_nominee_unit_id: input.nomineeUnitId,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["vote-counts", vars.categoryId] })
    },
  })
}

export function useVoteCounts(categoryId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["vote-counts", categoryId],
    enabled,
    refetchInterval: 20_000,
    queryFn: () => fetchVoteCounts(categoryId),
  })
}

async function fetchVoteCounts(categoryId: string): Promise<VoteCount[]> {
  const { data, error } = await supabase.rpc("vote_counts", {
    p_category_id: categoryId,
  })
  if (error) throw new Error(error.message)
  return (data ?? []) as VoteCount[]
}

/** Live counts for several categories at once, keyed by category id. */
export function useVoteCountsMany(categoryIds: string[]) {
  return useQueries({
    queries: categoryIds.map((id) => ({
      queryKey: ["vote-counts", id],
      refetchInterval: 20_000,
      queryFn: () => fetchVoteCounts(id),
    })),
    combine: (results) => ({
      byCategory: new Map(
        categoryIds.map((id, i) => [id, results[i]?.data] as const),
      ),
      isLoading: results.some((r) => r.isLoading),
    }),
  })
}
