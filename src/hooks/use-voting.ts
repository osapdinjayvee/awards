import { useMutation } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { TranslationKey } from "@/lib/i18n"
import type { EmploymentGroup, VotedEntry } from "@/lib/types"

export interface VerifyResult {
  voter_id: string
  full_name: string
  voted: VotedEntry[]
}

/** Known RPC error tokens -> translation key. */
export function votingErrorKey(err: unknown): TranslationKey {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes("not_authorized")) return "err.notAuthorized"
  if (msg.includes("too_many_attempts")) return "err.tooManyAttempts"
  if (msg.includes("already_voted")) return "err.alreadyVoted"
  if (msg.includes("event_closed")) return "err.eventClosed"
  if (msg.includes("invalid_id")) return "err.invalidId"
  if (
    msg.includes("invalid_vote") ||
    msg.includes("invalid_nominee") ||
    msg.includes("invalid_section") ||
    msg.includes("invalid_category")
  )
    return "err.invalidVote"
  return "err.generic"
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
  return useMutation({
    mutationFn: async (input: {
      categoryId: string
      section: EmploymentGroup | null
      divisionId: string | null
      idNumber: string
      name: string
      nomineePersonId: string | null
      nomineeUnitId: string | null
    }) => {
      const { error } = await supabase.rpc("cast_vote", {
        p_event_id: eventId,
        p_category_id: input.categoryId,
        p_section: input.section,
        p_division_id: input.divisionId,
        p_id_number: input.idNumber,
        p_name: input.name,
        p_nominee_person_id: input.nomineePersonId,
        p_nominee_unit_id: input.nomineeUnitId,
      })
      if (error) throw new Error(error.message)
    },
  })
}
