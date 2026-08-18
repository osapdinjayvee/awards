import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useOutletContext } from "react-router"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  EMPLOYMENT_GROUP_LABELS,
  eventIsOpen,
  sectionsForCategory,
  type AwardEvent,
  type CategoryWithCriteria,
  type EmploymentGroup,
  type VotedEntry,
  type VoterIdentity,
} from "@/lib/types"
import {
  clearVoterIdentity,
  loadVoterIdentity,
  saveVoterIdentity,
} from "@/lib/voter"
import { useRoster, useUnits } from "@/hooks/use-event"
import {
  useCastVote,
  useVerifyVoter,
  useVoteCounts,
  votingErrorMessage,
} from "@/hooks/use-voting"
import { VoterGate } from "./voter-gate"
import { SectionPoll, type Candidate } from "./section-poll"

type Ctx = { event: AwardEvent; categories: CategoryWithCriteria[] }

type BallotStep = {
  category: CategoryWithCriteria
  section: EmploymentGroup | null
}

const stepKey = (categoryId: string, section: EmploymentGroup | null) =>
  `${categoryId}:${section ?? "_team"}`

function sectionLabel(step: BallotStep): string {
  return step.section
    ? EMPLOYMENT_GROUP_LABELS[step.section]
    : "Units & Offices"
}

export function VotingPage() {
  const { event, categories } = useOutletContext<Ctx>()
  const navigate = useNavigate()
  const open = eventIsOpen(event)

  const steps = useMemo<BallotStep[]>(
    () =>
      categories.flatMap((category) =>
        sectionsForCategory(category).map((section) => ({ category, section })),
      ),
    [categories],
  )

  const [identity, setIdentity] = useState<VoterIdentity | null>(() =>
    loadVoterIdentity(event.id),
  )
  const [votedMap, setVotedMap] = useState<Map<string, VotedEntry> | null>(null)
  const [index, setIndex] = useState<number | null>(null) // null until resume point known

  const verify = useVerifyVoter(event.id)
  const castVote = useCastVote(event.id)
  const { data: people = [] } = useRoster(event.id)
  const { data: units = [] } = useUnits(event.id)

  // Re-verify a stored identity on mount: refresh the voted list (server truth)
  useEffect(() => {
    if (!identity || votedMap) return
    verify
      .mutateAsync({ idNumber: identity.idNumber, name: identity.enteredName })
      .then((result) => {
        applyVotedList(result.voted)
      })
      .catch(() => {
        clearVoterIdentity(event.id)
        setIdentity(null)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity])

  function applyVotedList(voted: VotedEntry[]) {
    const map = new Map(voted.map((v) => [stepKey(v.category_id, v.section), v]))
    setVotedMap(map)
    setIndex((prev) => {
      if (prev !== null) return prev
      const firstOpen = steps.findIndex(
        (s) => !map.has(stepKey(s.category.id, s.section)),
      )
      return firstOpen === -1 ? steps.length : firstOpen
    })
  }

  const step = index !== null && index < steps.length ? steps[index] : null
  const currentVoted = step
    ? (votedMap?.get(stepKey(step.category.id, step.section)) ?? null)
    : null

  const counts = useVoteCounts(step?.category.id ?? "", !!step && !!currentVoted)

  const candidates = useMemo<Candidate[]>(() => {
    if (!step) return []
    if (step.section === null) {
      return units.map((u) => ({ id: u.id, label: u.name, sub: null }))
    }
    return people
      .filter((p) => p.classification === step.section)
      .map((p) => ({ id: p.id, label: p.full_name, sub: p.position }))
  }, [step, people, units])

  const sectionCounts = useMemo(() => {
    if (!step || !counts.data) return undefined
    return counts.data.filter((c) => (c.section ?? null) === step.section)
  }, [counts.data, step])

  if (!open) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-muted-foreground">Voting for this event is closed.</p>
        <Button asChild variant="outline">
          <Link to={`/e/${event.slug}`}>Back to {event.title}</Link>
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
          toast.success(`Welcome, ${result.full_name}`)
        }}
      />
    )
  }

  if (votedMap === null || index === null) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // ---------- Finish screen ----------
  if (!step) {
    const skipped = steps.filter(
      (s) => !votedMap.has(stepKey(s.category.id, s.section)),
    )
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <PartyPopper className="size-7" />
        </span>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {skipped.length === 0 ? "Ballot complete" : "Almost done"}
          </h1>
          <p className="text-sm text-muted-foreground">
            You voted in {steps.length - skipped.length} of {steps.length}{" "}
            sections
            {skipped.length === 0
              ? ". Thank you for taking part!"
              : ` — ${skipped.length} still open.`}
          </p>
        </div>
        {skipped.length > 0 && (
          <div className="w-full space-y-2">
            {skipped.map((s) => (
              <button
                key={stepKey(s.category.id, s.section)}
                type="button"
                onClick={() =>
                  setIndex(
                    steps.findIndex(
                      (x) =>
                        x.category.id === s.category.id &&
                        x.section === s.section,
                    ),
                  )
                }
                className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors hover:border-primary/40"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {s.category.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {sectionLabel(s)}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-primary">Vote now</span>
              </button>
            ))}
          </div>
        )}
        <Button asChild variant="outline" className="rounded-full">
          <Link to={`/e/${event.slug}`}>Back to the awards</Link>
        </Button>
      </div>
    )
  }

  // ---------- Ballot step ----------
  const stepNumber = index + 1
  const votedCount = votedMap.size

  async function handleCast(candidateId: string) {
    if (!step || !identity) return
    try {
      await castVote.mutateAsync({
        categoryId: step.category.id,
        section: step.section,
        idNumber: identity.idNumber,
        name: identity.enteredName,
        nomineePersonId: step.section ? candidateId : null,
        nomineeUnitId: step.section ? null : candidateId,
      })
      setVotedMap((prev) => {
        const next = new Map(prev)
        next.set(stepKey(step.category.id, step.section), {
          category_id: step.category.id,
          section: step.section,
          nominee_person_id: step.section ? candidateId : null,
          nominee_unit_id: step.section ? null : candidateId,
        })
        return next
      })
    } catch (err) {
      const msg = votingErrorMessage(err)
      toast.error(msg)
      if (msg.includes("already voted")) {
        // reconcile with server truth
        verify
          .mutateAsync({ idNumber: identity.idNumber, name: identity.enteredName })
          .then((r) => applyVotedList(r.voted))
          .catch(() => undefined)
      }
    }
  }

  return (
    <div className="mx-auto flex h-svh max-w-2xl flex-col">
      {/* Sticky ballot header */}
      <header className="border-b bg-background px-6 pb-4 pt-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 text-muted-foreground"
            onClick={() => navigate(`/e/${event.slug}`)}
          >
            <ArrowLeft className="size-4" /> Exit
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            Step {stepNumber} of {steps.length} · {votedCount} voted
          </span>
        </div>

        {/* Segmented progress: one segment per step */}
        <div className="mb-4 flex gap-1" aria-hidden="true">
          {steps.map((s, i) => {
            const done = votedMap.has(stepKey(s.category.id, s.section))
            return (
              <div
                key={stepKey(s.category.id, s.section)}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  done
                    ? "bg-primary"
                    : i === index
                      ? "bg-primary/40"
                      : "bg-muted",
                )}
              />
            )
          })}
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {step.category.name}
        </p>
        <h1 className="mt-0.5 flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
          {sectionLabel(step)}
          {currentVoted && (
            <CheckCircle2 className="size-4 text-primary" aria-label="Voted" />
          )}
        </h1>
      </header>

      <SectionPoll
        key={stepKey(step.category.id, step.section)}
        candidates={candidates}
        votedNomineeId={
          currentVoted
            ? (currentVoted.nominee_person_id ?? currentVoted.nominee_unit_id)
            : null
        }
        counts={sectionCounts}
        countsLoading={counts.isLoading}
        casting={castVote.isPending}
        onCast={handleCast}
        onNext={() => setIndex(index + 1)}
        onSkip={() => setIndex(index + 1)}
        isLast={index === steps.length - 1}
      />
    </div>
  )
}
