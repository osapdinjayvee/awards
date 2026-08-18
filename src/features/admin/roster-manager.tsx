import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import {
  EMPLOYMENT_GROUP_LABELS,
  type RosterPerson,
  type Unit,
} from "@/lib/types"
import { RosterImport } from "./roster-import"

function useAdminRoster(eventId: string) {
  return useQuery({
    queryKey: ["admin", "roster", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roster_people")
        .select("*")
        .eq("event_id", eventId)
        .order("full_name")
      if (error) throw error
      return data as RosterPerson[]
    },
  })
}

function useAdminUnits(eventId: string) {
  return useQuery({
    queryKey: ["admin", "units", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("event_id", eventId)
        .order("name")
      if (error) throw error
      return data as Unit[]
    },
  })
}

export function RosterManager({ eventId }: { eventId: string }) {
  const qc = useQueryClient()
  const { data: people, isLoading } = useAdminRoster(eventId)
  const { data: units } = useAdminUnits(eventId)
  const [search, setSearch] = useState("")
  const [unitsDraft, setUnitsDraft] = useState("")

  const filtered = useMemo(() => {
    if (!people) return []
    const q = search.trim().toLowerCase()
    if (!q) return people
    return people.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.position ?? "").toLowerCase().includes(q),
    )
  }, [people, search])

  const removePerson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("roster_people").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roster", eventId] })
      qc.invalidateQueries({ queryKey: ["roster", eventId] })
    },
    onError: () => toast.error("Could not remove — they may already be nominated."),
  })

  const addUnits = useMutation({
    mutationFn: async (names: string[]) => {
      const rows = names.map((name) => ({ event_id: eventId, name }))
      const { error } = await supabase
        .from("units")
        .upsert(rows, { onConflict: "event_id,name", ignoreDuplicates: true })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "units", eventId] })
      qc.invalidateQueries({ queryKey: ["units", eventId] })
      setUnitsDraft("")
      toast.success("Units saved.")
    },
    onError: () => toast.error("Could not save units."),
  })

  const removeUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("units").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "units", eventId] })
      qc.invalidateQueries({ queryKey: ["units", eventId] })
    },
    onError: () => toast.error("Could not remove — it may already be nominated."),
  })

  return (
    <div className="space-y-6">
      <RosterImport eventId={eventId} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            People ({people?.length ?? 0})
          </CardTitle>
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search name or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search ? "No matches." : "No people in the roster yet — import above."}
            </p>
          ) : (
            <div className="max-h-96 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.position ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {EMPLOYMENT_GROUP_LABELS[p.classification]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${p.full_name}`}
                          onClick={() => removePerson.mutate(p.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Units & offices ({units?.length ?? 0})
          </CardTitle>
          <CardDescription>
            Nominees for team categories. Add one unit per line.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {units && units.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {units.map((u) => (
                <Badge key={u.id} variant="secondary" className="gap-1 pr-1">
                  {u.name}
                  <button
                    type="button"
                    aria-label={`Remove ${u.name}`}
                    className="rounded-full p-0.5 hover:bg-destructive/20"
                    onClick={() => removeUnit.mutate(u.id)}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Textarea
              rows={3}
              placeholder={"Human Resource Management Office\nUniversity Library"}
              value={unitsDraft}
              onChange={(e) => setUnitsDraft(e.target.value)}
            />
            <Button
              size="sm"
              disabled={!unitsDraft.trim() || addUnits.isPending}
              onClick={() =>
                addUnits.mutate(
                  [...new Set(
                    unitsDraft
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )],
                )
              }
            >
              {addUnits.isPending && <Loader2 className="size-4 animate-spin" />}
              Add units
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
