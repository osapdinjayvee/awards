import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toCsv, downloadCsv } from "@/lib/csv"
import { supabase } from "@/lib/supabase"
import {
  EMPLOYMENT_GROUP_LABELS,
  sectionsForCategory,
  type AwardCategory,
  type AwardEvent,
  type EmploymentGroup,
} from "@/lib/types"

type VoteRow = {
  category_id: string
  section: EmploymentGroup | null
  nominee_person_id: string | null
  nominee_unit_id: string | null
  roster_people: { full_name: string; position: string | null } | null
  units: { name: string } | null
}

function useResults(eventId: string) {
  return useQuery({
    queryKey: ["admin", "results", eventId],
    refetchInterval: 30_000,
    queryFn: async () => {
      const [cats, votes, voters] = await Promise.all([
        supabase
          .from("award_categories")
          .select("*")
          .eq("event_id", eventId)
          .order("sort_order"),
        supabase
          .from("votes")
          .select(
            "category_id, section, nominee_person_id, nominee_unit_id, roster_people(full_name, position), units(name)",
          )
          .eq("event_id", eventId),
        supabase
          .from("voters")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId),
      ])
      if (cats.error) throw cats.error
      if (votes.error) throw votes.error
      return {
        categories: cats.data as AwardCategory[],
        votes: votes.data as unknown as VoteRow[],
        voterCount: voters.count ?? 0,
      }
    },
  })
}

type RankedRow = { name: string; sub: string | null; votes: number }

function rank(votes: VoteRow[]): RankedRow[] {
  const map = new Map<string, RankedRow>()
  for (const v of votes) {
    const key = v.nominee_person_id ?? v.nominee_unit_id ?? "?"
    const existing = map.get(key)
    if (existing) {
      existing.votes++
    } else {
      map.set(key, {
        name: v.roster_people?.full_name ?? v.units?.name ?? "(deleted)",
        sub: v.roster_people?.position ?? null,
        votes: 1,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.votes - a.votes)
}

export function ResultsViewer({ event }: { event: AwardEvent }) {
  const { data, isLoading, refetch, isRefetching } = useResults(event.id)

  const sections = useMemo(() => {
    if (!data) return []
    return data.categories.flatMap((cat) =>
      sectionsForCategory(cat).map((section) => ({
        cat,
        section,
        label: section ? EMPLOYMENT_GROUP_LABELS[section] : "Units & Offices",
        ranked: rank(
          data.votes.filter(
            (v) =>
              v.category_id === cat.id && (v.section ?? null) === section,
          ),
        ),
      })),
    )
  }, [data])

  function exportCsv() {
    const rows: (string | number | null)[][] = []
    for (const s of sections) {
      s.ranked.forEach((r, i) => {
        rows.push([s.cat.name, s.label, i + 1, r.name, r.sub, r.votes])
      })
    }
    downloadCsv(
      `${event.slug}-results.csv`,
      toCsv(["Category", "Section", "Rank", "Nominee", "Position", "Votes"], rows),
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const totalVotes = data.votes.length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {totalVotes} votes cast · {data.voterCount} authorized voters
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={isRefetching ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={totalVotes === 0}
          >
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      {sections.map((s) => {
        const max = s.ranked[0]?.votes || 1
        const sectionTotal = s.ranked.reduce((sum, r) => sum + r.votes, 0)
        return (
          <Card key={`${s.cat.id}:${s.section ?? "_team"}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-wrap items-baseline gap-x-2 text-base">
                {s.cat.name}
                <span className="text-sm font-normal text-muted-foreground">
                  · {s.label} · {sectionTotal} vote{sectionTotal === 1 ? "" : "s"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {s.ranked.length === 0 ? (
                <p className="text-sm text-muted-foreground">No votes yet.</p>
              ) : (
                <ol className="space-y-1.5">
                  {s.ranked.slice(0, 10).map((r, i) => (
                    <li
                      key={`${r.name}-${i}`}
                      className="relative overflow-hidden rounded-md border px-3 py-2"
                    >
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0"
                        style={{
                          width: `${(r.votes / max) * 90}%`,
                          backgroundColor: `color-mix(in oklab, var(--primary) ${i === 0 ? 16 : 8}%, transparent)`,
                        }}
                      />
                      <div className="relative flex items-center gap-3 text-sm">
                        <span className="w-5 shrink-0 text-center font-heading font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {r.name}
                          {r.sub && (
                            <span className="ml-2 font-normal text-muted-foreground">
                              {r.sub}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {r.votes}
                        </span>
                      </div>
                    </li>
                  ))}
                  {s.ranked.length > 10 && (
                    <p className="pt-1 text-xs text-muted-foreground">
                      + {s.ranked.length - 10} more with votes (all included in
                      the CSV export)
                    </p>
                  )}
                </ol>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
