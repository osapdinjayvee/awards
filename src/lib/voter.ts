import type { VoterIdentity } from "@/lib/types"

/**
 * Client mirror of the server's name normalization (003_voting.sql).
 * Used only for instant feedback in the gate dialog — the RPC verdict
 * is authoritative.
 */
export function nameTokens(raw: string): string[] {
  return [
    ...new Set(
      raw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // strip diacritics (ñ -> n)
        .replace(/[^a-z0-9]+/g, " ")
        .split(" ")
        .filter((t) => t.length > 1),
    ),
  ].sort()
}

export function looksLikeFullName(raw: string): boolean {
  return nameTokens(raw).length >= 2
}

// ---------- Per-event voter session (identity only; voted list is server truth) ----------

const key = (eventId: string) => `awards.voter.${eventId}`

export function loadVoterIdentity(eventId: string): VoterIdentity | null {
  try {
    const raw = sessionStorage.getItem(key(eventId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as VoterIdentity
    return parsed.voterId && parsed.idNumber ? parsed : null
  } catch {
    return null
  }
}

export function saveVoterIdentity(eventId: string, identity: VoterIdentity) {
  sessionStorage.setItem(key(eventId), JSON.stringify(identity))
}

export function clearVoterIdentity(eventId: string) {
  sessionStorage.removeItem(key(eventId))
}
