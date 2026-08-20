import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download, RefreshCw, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { downloadCsv, toCsv } from "@/lib/csv"
import { matchesTokens, normalizeForSearch, searchTokens } from "@/lib/search"
import { supabase } from "@/lib/supabase"
import {
  slotsForCategory,
  type AwardCategory,
  type AwardEvent,
  type Division,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type TurnoutRow = {
  voter_id: string
  id_number: string
  full_name: string
  votes_cast: number
  last_vote_at: string | null
}

type Filter = "all" | "none" | "partial" | "complete"

function useTurnout(eventId: string) {
  return useQuery({
    queryKey: ["admin", "turnout", eventId],
    refetchInterval: 30_000,
    queryFn: async () => {
      const [turnout, categories, divisions] = await Promise.all([
        supabase.rpc("voter_turnout", { p_event_id: eventId }),
        supabase
          .from("award_categories")
          .select("*")
          .eq("event_id", eventId)
          .order("sort_order"),
        supabase.from("divisions").select("*").eq("event_id", eventId),
      ])
      if (turnout.error) throw turnout.error
      if (categories.error) throw categories.error
      if (divisions.error) throw divisions.error
      const cats = categories.data as AwardCategory[]
      const divs = divisions.data as Division[]
      return {
        rows: (turnout.data ?? []) as TurnoutRow[],
        // How many sections a fully completed ballot has.
        totalSlots: cats.reduce(
          (n, c) => n + slotsForCategory(c, divs).length,
          0,
        ),
      }
    },
  })
}

type Status = Exclude<Filter, "all">

const statusOf = (row: TurnoutRow, total: number): Status =>
  row.votes_cast === 0 ? "none" : row.votes_cast >= total ? "complete" : "partial"

const STATUS_LABEL: Record<Status, string> = {
  none: "Not started",
  partial: "Partial",
  complete: "Complete",
}

/** Turnout tracking: who has voted, who still needs a nudge. */
export function TurnoutViewer({ event }: { event: AwardEvent }) {
  const { data, isLoading, refetch, isRefetching } = useTurnout(event.id)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const summary = useMemo(() => {
    const rows = data?.rows ?? []
    const total = data?.totalSlots ?? 0
    let none = 0
    let partial = 0
    let complete = 0
    for (const r of rows) {
      const s = statusOf(r, total)
      if (s === "none") none++
      else if (s === "partial") partial++
      else complete++
    }
    return { none, partial, complete, authorized: rows.length }
  }, [data])

  const filtered = useMemo(() => {
    const rows = data?.rows ?? []
    const total = data?.totalSlots ?? 0
    const tokens = searchTokens(search)
    return rows.filter((r) => {
      if (filter !== "all" && statusOf(r, total) !== filter) return false
      if (tokens.length === 0) return true
      return matchesTokens(
        normalizeForSearch(`${r.full_name} ${r.id_number}`),
        tokens,
      )
    })
  }, [data, filter, search])

  function exportCsv() {
    const total = data?.totalSlots ?? 0
    downloadCsv(
      `${event.slug}-turnout.csv`,
      toCsv(
        ["ID number", "Name", "Sections voted", "Of", "Status", "Last vote"],
        filtered.map((r) => [
          r.id_number,
          r.full_name,
          r.votes_cast,
          total,
          STATUS_LABEL[statusOf(r, total)],
          r.last_vote_at ? new Date(r.last_vote_at).toLocaleString() : "",
        ]),
      ),
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { totalSlots } = data
  const started = summary.partial + summary.complete
  const pct =
    summary.authorized > 0
      ? Math.round((started / summary.authorized) * 100)
      : 0

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Authorized voters", value: summary.authorized },
          { label: "Complete", value: summary.complete },
          { label: "Partial", value: summary.partial },
          { label: "Not started", value: summary.none },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">
            {started} of {summary.authorized} have started voting ·{" "}
            {totalSlots} sections in a full ballot
          </span>
          <span className="font-semibold tabular-nums">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="none">Not started</TabsTrigger>
            <TabsTrigger value="partial">Partial</TabsTrigger>
            <TabsTrigger value="complete">Complete</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name or ID number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={isRefetching ? "size-4 animate-spin" : "size-4"}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={filtered.length === 0}
          >
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {summary.authorized === 0
            ? "No authorized voters yet — import them in the Voters tab."
            : "No voters match this filter."}
        </p>
      ) : (
        <div className="max-h-[32rem] overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Voter</TableHead>
                <TableHead className="w-32">Sections</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-44">Last vote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const status = statusOf(r, totalSlots)
                return (
                  <TableRow key={r.voter_id}>
                    <TableCell>
                      <p className="font-medium">{r.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.id_number}
                      </p>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {r.votes_cast} / {totalSlots}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          status === "complete"
                            ? "default"
                            : status === "partial"
                              ? "secondary"
                              : "outline"
                        }
                        className={cn(
                          status === "none" && "text-muted-foreground",
                        )}
                      >
                        {STATUS_LABEL[status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.last_vote_at
                        ? new Date(r.last_vote_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
