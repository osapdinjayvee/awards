import { useMemo, useState } from "react"
import { Check, ChevronRight, Loader2, Search, Vote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { VoteCount } from "@/lib/types"

export interface Candidate {
  id: string
  label: string
  sub: string | null
}

export function SectionPoll({
  candidates,
  votedNomineeId,
  counts,
  countsLoading,
  casting,
  onCast,
  onNext,
  onSkip,
  isLast,
}: {
  candidates: Candidate[]
  /** non-null = this section is already voted; show results */
  votedNomineeId: string | null
  counts: VoteCount[] | undefined
  countsLoading: boolean
  casting: boolean
  onCast: (candidateId: string) => void
  onNext: () => void
  onSkip: () => void
  isLast: boolean
}) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return candidates
    return candidates.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.sub ?? "").toLowerCase().includes(q),
    )
  }, [candidates, search])

  // ---------- Results view ----------
  if (votedNomineeId) {
    const byId = new Map(
      (counts ?? []).map((c) => [c.nominee_person_id ?? c.nominee_unit_id, c.votes]),
    )
    const total = [...byId.values()].reduce((s, v) => s + v, 0)
    const ranked = candidates
      .map((c) => ({ ...c, votes: byId.get(c.id) ?? 0 }))
      .filter((c) => c.votes > 0 || c.id === votedNomineeId)
      .sort((a, b) => b.votes - a.votes)
    const max = ranked[0]?.votes || 1
    const silent = candidates.length - ranked.length

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
          <p className="pb-1 text-xs text-muted-foreground">
            {countsLoading && !counts ? "Loading results..." : `${total} vote${total === 1 ? "" : "s"} so far`}
          </p>
          {countsLoading && !counts ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : (
            ranked.map((c, i) => {
              const pct = total > 0 ? Math.round((c.votes / total) * 100) : 0
              const isMine = c.id === votedNomineeId
              return (
                <div
                  key={c.id}
                  className={cn(
                    "relative overflow-hidden rounded-xl border px-4 py-3",
                    isMine && "border-primary/50 ring-1 ring-primary/30",
                  )}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 rounded-r-md transition-all duration-500"
                    style={{
                      width: `${(c.votes / max) * 88}%`,
                      backgroundColor: `color-mix(in oklab, var(--primary) ${i === 0 ? 18 : 10}%, transparent)`,
                    }}
                  />
                  <div className="relative flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {c.label}
                        {isMine && (
                          <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            <Check className="size-2.5" /> Your vote
                          </span>
                        )}
                      </p>
                      {c.sub && (
                        <p className="truncate text-xs text-muted-foreground">{c.sub}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {pct}%
                    </span>
                    <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {c.votes}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          {!countsLoading && silent > 0 && (
            <p className="pt-1 text-center text-xs text-muted-foreground">
              {silent} other candidate{silent === 1 ? " has" : "s have"} no votes yet
            </p>
          )}
        </div>
        <div className="sticky bottom-0 border-t bg-background/95 p-4 backdrop-blur-sm">
          <Button onClick={onNext} size="lg" className="w-full rounded-full">
            {isLast ? "Finish" : "Next"} <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ---------- Choosing view ----------
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-6 py-3 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="rounded-full pl-9"
            placeholder={`Search ${candidates.length} candidates...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-6 py-4" role="radiogroup">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No candidates match "{search}".
          </p>
        ) : (
          filtered.map((c) => {
            const isSelected = selected === c.id
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(isSelected ? null : c.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-secondary"
                    : "hover:border-primary/40 hover:bg-secondary/50",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40",
                  )}
                >
                  {isSelected && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.label}</span>
                  {c.sub && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.sub}
                    </span>
                  )}
                </span>
              </button>
            )
          })
        )}
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t bg-background/95 p-4 backdrop-blur-sm">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="shrink-0 text-muted-foreground"
        >
          Skip for now
        </Button>
        <Button
          size="lg"
          disabled={!selected || casting}
          onClick={() => selected && onCast(selected)}
          className="flex-1 rounded-full"
        >
          {casting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Vote className="size-4" />
          )}
          Cast vote
        </Button>
      </div>
    </div>
  )
}
