export type EventStatus = "draft" | "open" | "closed" | "archived"
export type CategoryType = "individual" | "team"
export type EmploymentGroup =
  | "permanent_teaching"
  | "permanent_non_teaching"
  | "job_order_cos"

export const EMPLOYMENT_GROUP_LABELS: Record<EmploymentGroup, string> = {
  permanent_teaching: "Permanent Teaching",
  permanent_non_teaching: "Permanent Non-Teaching",
  job_order_cos: "Job Order / COS",
}

export const ALL_EMPLOYMENT_GROUPS = Object.keys(
  EMPLOYMENT_GROUP_LABELS,
) as EmploymentGroup[]

export interface AwardEvent {
  id: string
  slug: string
  title: string
  description: string | null
  welcome_text: string | null
  opens_at: string | null
  closes_at: string | null
  status: EventStatus
  logo_path: string | null
  banner_path: string | null
  primary_color: string
  accent_color: string
  created_at: string
  updated_at: string
}

export interface AwardCategory {
  id: string
  event_id: string
  name: string
  type: CategoryType
  description: string | null
  eligible_groups: EmploymentGroup[] | null
  sort_order: number
}

export interface Criterion {
  id: string
  category_id: string
  name: string
  description: string | null
  weight: number
  sort_order: number
}

export type CategoryWithCriteria = AwardCategory & { criteria: Criterion[] }

export interface RosterPerson {
  id: string
  event_id: string
  full_name: string
  position: string | null
  classification: EmploymentGroup
}

export interface Unit {
  id: string
  event_id: string
  name: string
}

export interface Nomination {
  id: string
  event_id: string
  category_id: string
  nominee_person_id: string | null
  nominee_unit_id: string | null
  nominator_name: string
  nominator_email: string
  justification: string
  status: string
  created_at: string
}

export interface NominationAttachment {
  id: string
  nomination_id: string
  storage_path: string
  file_name: string | null
  mime_type: string | null
  size_bytes: number | null
  created_at: string
}

/** Is the event currently accepting nominations? (client-side mirror of event_is_open) */
export function eventIsOpen(e: AwardEvent, now = new Date()): boolean {
  if (e.status !== "open") return false
  if (e.opens_at && now < new Date(e.opens_at)) return false
  if (e.closes_at && now > new Date(e.closes_at)) return false
  return true
}

// ---------- Voting ----------
export interface Voter {
  id: string
  event_id: string
  id_number: string
  full_name: string
  created_at: string
}

export interface VotedEntry {
  category_id: string
  section: EmploymentGroup | null
  nominee_person_id: string | null
  nominee_unit_id: string | null
}

export interface VoterIdentity {
  voterId: string
  fullName: string
  idNumber: string
  enteredName: string
}

export interface VoteCount {
  section: EmploymentGroup | null
  nominee_person_id: string | null
  nominee_unit_id: string | null
  votes: number
}

/** Display order for sections within a category. */
export const SECTION_ORDER: EmploymentGroup[] = [
  "job_order_cos",
  "permanent_teaching",
  "permanent_non_teaching",
]

/**
 * The sections a category is contested in.
 * Team categories vote over units (a single null section);
 * individual categories split by eligible employment groups (null/empty = all).
 */
export function sectionsForCategory(cat: AwardCategory): (EmploymentGroup | null)[] {
  if (cat.type === "team") return [null]
  const groups =
    cat.eligible_groups && cat.eligible_groups.length > 0
      ? cat.eligible_groups
      : SECTION_ORDER
  return SECTION_ORDER.filter((g) => groups.includes(g))
}
