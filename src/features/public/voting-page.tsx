import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useOutletContext } from "react-router"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  PartyPopper,
  Sparkles,
  UserRoundCog,
  Vote,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  EMPLOYMENT_GROUP_LABELS,
  eventIsOpen,
  slotKey,
  slotsForCategory,
  type AwardEvent,
  type CategoryWithCriteria,
  type BallotSlot,
  type Division,
  type VotedEntry,
  type VoterIdentity,
} from "@/lib/types"
import {
  clearVoterIdentity,
  loadVoterIdentity,
  saveVoterIdentity,
} from "@/lib/voter"
import { eventLogo } from "@/lib/theme"
import { useDivisions, useRoster, useUnits } from "@/hooks/use-event"
import {
  useCastVote,
  useVerifyVoter,
  useVoteCountsMany,
  votingErrorKey,
} from "@/hooks/use-voting"
import { useLang } from "@/hooks/use-lang"
import { localized } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { CriteriaBar } from "./criteria-bar"
import { VoterGate } from "./voter-gate"
import { BallotSection, type Candidate } from "./ballot-section"

type Ctx = { event: AwardEvent; categories: CategoryWithCriteria[] }

type BallotStep = { category: CategoryWithCriteria; slot: BallotSlot }

/** Employment group for individual awards, division name for team awards. */
function slotLabel(
  slot: BallotSlot,
  divisions: Division[],
  fallback: string,
): string {
  if (slot.section) return EMPLOYMENT_GROUP_LABELS[slot.section]
  return divisions.find((d) => d.id === slot.divisionId)?.name ?? fallback
}

/** Brand-tinted page wash behind the ballot. */
function PageWash() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-linear-to-b from-primary/8 via-background to-background" />
      <div className="absolute -top-32 -right-24 size-96 rounded-full bg-chart-2/15 blur-3xl" />
      <div className="absolute top-1/3 -left-32 size-80 rounded-full bg-primary/10 blur-3xl" />
    </div>
  )
}

export function VotingPage() {
  const { event, categories } = useOutletContext<Ctx>()
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const open = eventIsOpen(event)

  const { data: divisions = [], isLoading: divisionsLoading } = useDivisions(
    event.id,
  )

  const steps = useMemo<BallotStep[]>(
    () =>
      categories.flatMap((category) =>
        slotsForCategory(category, divisions).map((slot) => ({
          category,
          slot,
        })),
      ),
    [categories, divisions],
  )

  const [identity, setIdentity] = useState<VoterIdentity | null>(() =>
    loadVoterIdentity(event.id),
  )
  const [votedMap, setVotedMap] = useState<Map<string, VotedEntry> | null>(null)
  /** stepKey -> candidate id the voter has selected but not yet submitted */
  const [picks, setPicks] = useState<Map<string, string>>(new Map())
  const [submitting, setSubmitting] = useState(false)

  const verify = useVerifyVoter(event.id)
  const castVote = useCastVote(event.id)
  const { data: people = [] } = useRoster(event.id)
  const { data: units = [] } = useUnits(event.id)

  // Live tallies only for categories the voter has already weighed in on.
  const votedCategoryIds = useMemo(() => {
    if (!votedMap) return []
    return [...new Set([...votedMap.values()].map((v) => v.category_id))].sort()
  }, [votedMap])
  const counts = useVoteCountsMany(votedCategoryIds)

  /** Candidates keyed by slot: employment group, or division id for units. */
  const candidatesFor = useMemo(() => {
    const byKey = new Map<string, Candidate[]>()
    const push = (key: string, c: Candidate) => {
      const list = byKey.get(key) ?? []
      list.push(c)
      byKey.set(key, list)
    }
    for (const u of units) {
      if (!u.division_id) continue
      push(u.division_id, { id: u.id, label: u.name, sub: null })
    }
    for (const person of people) {
      push(person.classification, {
        id: person.id,
        label: person.full_name,
        sub: person.position,
      })
    }
    return byKey
  }, [people, units])

  const candidatesForSlot = (slot: BallotSlot): Candidate[] =>
    candidatesFor.get(slot.section ?? slot.divisionId ?? "") ?? []

  // Re-verify a stored identity on mount: refresh the voted list (server truth)
  useEffect(() => {
    if (!identity || votedMap) return
    verify
      .mutateAsync({ idNumber: identity.idNumber, name: identity.enteredName })
      .then((result) => applyVotedList(result.voted))
      .catch(() => {
        clearVoterIdentity(event.id)
        setIdentity(null)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity])

  /** Sign this voter out and go back to the ID gate. */
  function switchVoter() {
    clearVoterIdentity(event.id)
    setIdentity(null)
    setVotedMap(null)
    setPicks(new Map())
  }

  function applyVotedList(voted: VotedEntry[]) {
    const map = new Map(
      voted.map((v) => [
        slotKey(v.category_id, {
          section: v.section,
          divisionId: v.division_id,
        }),
        v,
      ]),
    )
    setVotedMap(map)
    setPicks((prev) => {
      const next = new Map(prev)
      for (const key of map.keys()) next.delete(key)
      return next
    })
  }

  if (!open) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-3 p-8 text-center">
        <PageWash />
        <p className="text-muted-foreground">{t("ballot.closed")}</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link to={`/e/${event.slug}`}>
            {t("common.backTo", { title: event.title })}
          </Link>
        </Button>
      </div>
    )
  }

  if (!identity) {
    return (
      <VoterGate
        event={event}
        onVerified={(idNumber, name, result) => {
          const id: VoterIdentity = {
            voterId: result.voter_id,
            fullName: result.full_name,
            idNumber,
            enteredName: name,
          }
          saveVoterIdentity(event.id, id)
          setIdentity(id)
          applyVotedList(result.voted)
          toast.success(t("ballot.welcome", { name: result.full_name }))
        }}
      />
    )
  }

  // Divisions decide how many team slots exist, so wait for them before
  // judging the ballot complete.
  if (votedMap === null || divisionsLoading) {
    return (
      <div className="relative min-h-svh">
        <PageWash />
        <div className="mx-auto max-w-3xl space-y-4 p-8">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  const votedCount = steps.filter((s) =>
    votedMap.has(slotKey(s.category.id, s.slot)),
  ).length
  const pendingKeys = [...picks.keys()].filter((k) => !votedMap.has(k))
  const remaining = steps.length - votedCount - pendingKeys.length
  const allDone = votedCount === steps.length

  async function handleSubmit() {
    if (!identity || !votedMap || pendingKeys.length === 0) return
    const byKey = new Map(
      steps.map((s) => [slotKey(s.category.id, s.slot), s]),
    )
    setSubmitting(true)
    const cast: VotedEntry[] = []
    const failures: string[] = []

    for (const key of pendingKeys) {
      const step = byKey.get(key)
      const candidateId = picks.get(key)
      if (!step || !candidateId) continue
      const isTeam = step.slot.section === null
      const entry: VotedEntry = {
        category_id: step.category.id,
        section: step.slot.section,
        division_id: step.slot.divisionId,
        nominee_person_id: isTeam ? null : candidateId,
        nominee_unit_id: isTeam ? candidateId : null,
      }
      try {
        await castVote.mutateAsync({
          categoryId: step.category.id,
          section: step.slot.section,
          divisionId: step.slot.divisionId,
          idNumber: identity.idNumber,
          name: identity.enteredName,
          nomineePersonId: entry.nominee_person_id,
          nomineeUnitId: entry.nominee_unit_id,
        })
        cast.push(entry)
      } catch (err) {
        failures.push(
          `${step.category.name} — ${slotLabel(step.slot, divisions, t("ballot.unitsAndOffices"))}: ${t(votingErrorKey(err))}`,
        )
      }
    }

    if (cast.length > 0) {
      setVotedMap((prev) => {
        const next = new Map(prev)
        for (const entry of cast) {
          next.set(
            slotKey(entry.category_id, {
              section: entry.section,
              divisionId: entry.division_id,
            }),
            entry,
          )
        }
        return next
      })
      setPicks((prev) => {
        const next = new Map(prev)
        for (const entry of cast) {
          next.delete(
            slotKey(entry.category_id, {
              section: entry.section,
              divisionId: entry.division_id,
            }),
          )
        }
        return next
      })
      toast.success(t("ballot.submitted", { n: cast.length }))
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    if (failures.length > 0) {
      toast.error(failures[0], {
        description:
          failures.length > 1
            ? t("ballot.moreFailed", { n: failures.length - 1 })
            : undefined,
      })
      // Reconcile with server truth — some sections may already be locked in.
      verify
        .mutateAsync({ idNumber: identity.idNumber, name: identity.enteredName })
        .then((r) => applyVotedList(r.voted))
        .catch(() => undefined)
    }

    setSubmitting(false)
  }

  return (
    <div className="relative min-h-svh">
      <PageWash />

      {/* Sticky ballot header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 h-8 rounded-full px-3 text-muted-foreground"
              onClick={() => navigate(`/e/${event.slug}`)}
            >
              <ArrowLeft className="size-4" /> {t("common.exit")}
            </Button>
            <div className="flex min-w-0 items-center gap-2">
              <LanguageSwitcher />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs transition-colors hover:border-primary/40 hover:bg-card"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                      {identity.fullName.slice(0, 1)}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {identity.fullName}
                    </span>
                    <UserRoundCog className="size-3.5 shrink-0 text-muted-foreground" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-heading">
                      {t("ballot.switchTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("ballot.switchBody", { name: identity.fullName })}
                      {pendingKeys.length > 0
                        ? t("ballot.switchPending", { n: pendingKeys.length })
                        : ""}
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full">
                      {t("ballot.switchStay")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-full"
                      onClick={switchVoter}
                    >
                      {t("ballot.switchConfirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* One segment per section: submitted, selected, or untouched */}
          <div className="flex gap-1" aria-hidden="true">
            {steps.map((s) => {
              const key = slotKey(s.category.id, s.slot)
              const done = votedMap.has(key)
              const picked = picks.has(key)
              return (
                <span
                  key={key}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    done
                      ? "bg-primary"
                      : picked
                        ? "bg-primary/45"
                        : "bg-muted-foreground/15",
                  )}
                />
              )
            })}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">
              {t("ballot.progress", { voted: votedCount, total: steps.length })}
            </span>
            {pendingKeys.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium tabular-nums text-primary">
                {t("ballot.readyToSend", { n: pendingKeys.length })}
              </span>
            )}
            {remaining > 0 && (
              <span>· {t("ballot.left", { n: remaining })}</span>
            )}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-40 sm:px-6">
        <div className="pb-7 pt-10">
          <img
            src={eventLogo(event)}
            alt=""
            className="mb-4 size-14 rounded-full bg-white object-contain p-1 shadow-sm ring-1 ring-border/60"
          />
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3.5" /> {event.title}
          </p>
          <h1 className="mt-3 text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {allDone ? t("ballot.titleDone") : t("ballot.title")}
          </h1>
          <p className="mt-3 max-w-prose text-pretty text-sm/relaxed text-muted-foreground">
            {allDone ? t("ballot.introDone") : t("ballot.intro")}
          </p>
        </div>

        <div className="space-y-5">
          {categories.map((category, ci) => {
            const slots = slotsForCategory(category, divisions)
            const categoryDone =
              slots.length > 0 &&
              slots.every((s) => votedMap.has(slotKey(category.id, s)))
            return (
              <article
                key={category.id}
                className={cn(
                  "overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-xs backdrop-blur-sm transition-shadow duration-200 hover:shadow-md",
                  categoryDone && "border-primary/25",
                )}
              >
                <header className="relative border-b border-border/60 bg-linear-to-br from-primary/8 via-card/0 to-card/0 px-5 py-5 sm:px-6">
                  <div className="flex items-start gap-3.5">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold tabular-nums shadow-xs",
                        categoryDone
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {categoryDone ? (
                        <CheckCircle2 className="size-4.5" />
                      ) : (
                        ci + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-balance font-heading text-lg font-semibold tracking-tight sm:text-xl">
                        {localized(category, "name", lang)}
                      </h2>
                      {category.description && (
                        <p className="mt-1.5 text-pretty text-sm/relaxed text-muted-foreground">
                          {localized(category, "description", lang)}
                        </p>
                      )}
                      {category.criteria.length > 0 && (
                        <details className="group mt-3">
                          <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground [&::-webkit-details-marker]:hidden">
                            {t("ballot.howJudged")}
                            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="pt-4">
                            <CriteriaBar criteria={category.criteria} />
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </header>

                <div className="divide-y divide-border/60">
                  {slots.length === 0 && (
                    <p className="p-5 text-sm text-muted-foreground sm:p-6">
                      {t("ballot.noDivisions")}
                    </p>
                  )}
                  {slots.map((slot) => {
                    const key = slotKey(category.id, slot)
                    const voted = votedMap.get(key) ?? null
                    const categoryCounts = counts.byCategory.get(category.id)
                    return (
                      <BallotSection
                        key={key}
                        title={slotLabel(
                          slot,
                          divisions,
                          t("ballot.unitsAndOffices"),
                        )}
                        candidates={candidatesForSlot(slot)}
                        votedNomineeId={
                          voted
                            ? (voted.nominee_person_id ?? voted.nominee_unit_id)
                            : null
                        }
                        pickedId={picks.get(key) ?? null}
                        onPick={(candidateId) =>
                          setPicks((prev) => {
                            const next = new Map(prev)
                            if (candidateId) next.set(key, candidateId)
                            else next.delete(key)
                            return next
                          })
                        }
                        counts={categoryCounts?.filter(
                          (c) =>
                            (c.section ?? null) === slot.section &&
                            (c.division_id ?? null) === slot.divisionId,
                        )}
                        countsLoading={counts.isLoading && !categoryCounts}
                        disabled={submitting}
                      />
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>

        {allDone && (
          <div className="mt-8 overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/12 via-card/60 to-chart-2/10 px-6 py-10 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <PartyPopper className="size-6" />
            </span>
            <h2 className="mt-4 font-heading text-xl font-semibold tracking-tight">
              {t("ballot.thanksTitle")}
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              {t("ballot.thanksBody", { title: event.title })}
            </p>
            <Button asChild variant="outline" className="mt-5 rounded-full">
              <Link to={`/e/${event.slug}`}>{t("common.backToAwards")}</Link>
            </Button>
          </div>
        )}
      </main>

      {/* Floating submit dock */}
      {!allDone && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-5">
          <div className="pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-full border border-border/60 bg-background/70 p-2 pl-5 shadow-lg backdrop-blur-xl">
            <p className="min-w-0 flex-1 text-xs/snug text-muted-foreground">
              {pendingKeys.length === 0
                ? remaining > 0
                  ? t("ballot.dockEmpty", { n: remaining })
                  : t("ballot.dockNothing")
                : t("ballot.dockReady", { n: pendingKeys.length })}
            </p>
            <Button
              size="lg"
              className="shrink-0 rounded-full shadow-sm"
              disabled={pendingKeys.length === 0 || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Vote className="size-4" />
              )}
              {t("ballot.submit", { n: pendingKeys.length })}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
