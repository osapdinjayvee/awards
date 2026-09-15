import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
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
import { fetchAllRows, supabase } from "@/lib/supabase"
import { type Division, type Unit } from "@/lib/types"

export function useAdminDivisions(eventId: string) {
  return useQuery({
    queryKey: ["admin", "divisions", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("divisions")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order")
      if (error) throw error
      return data as Division[]
    },
  })
}

/** Team ballots cast per division — deleting a division would cascade these away. */
function useDivisionVoteCounts(eventId: string) {
  return useQuery({
    queryKey: ["admin", "division-votes", eventId],
    queryFn: async () => {
      const data = await fetchAllRows<{ division_id: string }>((from, to) =>
        supabase
          .from("votes")
          .select("division_id")
          .eq("event_id", eventId)
          .not("division_id", "is", null)
          .order("id")
          .range(from, to)
          .overrideTypes<{ division_id: string }[], { merge: false }>(),
      )
      const counts = new Map<string, number>()
      for (const v of data) {
        counts.set(v.division_id, (counts.get(v.division_id) ?? 0) + 1)
      }
      return counts
    },
  })
}

export function DivisionsEditor({
  eventId,
  units,
}: {
  eventId: string
  units: Unit[] | undefined
}) {
  const qc = useQueryClient()
  const { data: divisions, isLoading } = useAdminDivisions(eventId)
  const { data: voteCounts } = useDivisionVoteCounts(eventId)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "divisions", eventId] })
    qc.invalidateQueries({ queryKey: ["divisions", eventId] })
  }

  const onNameError = (e: unknown) =>
    toast.error(
      (e as { code?: string })?.code === "23505"
        ? "A division with that name already exists."
        : "Could not save the division.",
    )

  const add = useMutation({
    mutationFn: async (name: string) => {
      const nextOrder =
        Math.max(0, ...(divisions ?? []).map((d) => d.sort_order)) + 1
      const { error } = await supabase
        .from("divisions")
        .insert({ event_id: eventId, name, sort_order: nextOrder })
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      setNewName("")
      toast.success("Division added.")
    },
    onError: onNameError,
  })

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("divisions")
        .update({ name })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      setEditingId(null)
      toast.success("Division renamed.")
    },
    onError: onNameError,
  })

  const swapOrder = useMutation({
    mutationFn: async ({ a, b }: { a: Division; b: Division }) => {
      for (const [d, order] of [
        [a, b.sort_order],
        [b, a.sort_order],
      ] as const) {
        const { error } = await supabase
          .from("divisions")
          .update({ sort_order: order })
          .eq("id", d.id)
        if (error) throw error
      }
    },
    onSuccess: invalidate,
    onError: () => toast.error("Could not reorder the divisions."),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("divisions").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      // Its units survive but come back with division_id cleared.
      qc.invalidateQueries({ queryKey: ["admin", "units", eventId] })
      qc.invalidateQueries({ queryKey: ["units", eventId] })
      toast.success("Division deleted.")
    },
    onError: () => toast.error("Could not delete the division."),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Divisions ({divisions?.length ?? 0})
        </CardTitle>
        <CardDescription>
          The team award is contested per division — voters pick one unit in
          each. Adding or removing one changes every ballot.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !divisions || divisions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No divisions yet — the team award has nothing to contest.
          </p>
        ) : (
          <div className="divide-y rounded-md border">
            {divisions.map((d, i) => {
              const unitCount = (units ?? []).filter(
                (u) => u.division_id === d.id,
              ).length
              const votes = voteCounts?.get(d.id) ?? 0
              return (
                <div key={d.id} className="flex items-center gap-2 p-2">
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-5"
                      aria-label={`Move ${d.name} up`}
                      disabled={i === 0 || swapOrder.isPending}
                      onClick={() =>
                        swapOrder.mutate({ a: d, b: divisions[i - 1] })
                      }
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-5"
                      aria-label={`Move ${d.name} down`}
                      disabled={i === divisions.length - 1 || swapOrder.isPending}
                      onClick={() =>
                        swapOrder.mutate({ a: d, b: divisions[i + 1] })
                      }
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>

                  {editingId === d.id ? (
                    <>
                      <Input
                        autoFocus
                        className="h-8 flex-1"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editName.trim()) {
                            rename.mutate({ id: d.id, name: editName.trim() })
                          }
                          if (e.key === "Escape") setEditingId(null)
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Save name"
                        disabled={!editName.trim() || rename.isPending}
                        onClick={() =>
                          rename.mutate({ id: d.id, name: editName.trim() })
                        }
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Cancel rename"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {d.name}
                      </span>
                      <Badge variant="outline">
                        {unitCount} {unitCount === 1 ? "unit" : "units"}
                      </Badge>
                      {votes > 0 && (
                        <Badge variant="secondary">{votes} votes</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Rename ${d.name}`}
                        onClick={() => {
                          setEditingId(d.id)
                          setEditName(d.name)
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {votes > 0 ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled
                          aria-label={`Cannot delete ${d.name} — it has votes`}
                          title={`${votes} ballots have been cast in this division. Deleting it would erase them.`}
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${d.name}`}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete "{d.name}"?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {unitCount > 0
                                  ? `Its ${unitCount} ${unitCount === 1 ? "unit stays" : "units stay"} in the list but lose their division, which makes them unvotable until you reassign them. The team ballot loses this division.`
                                  : "The team ballot loses this division."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => remove.mutate(d.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            className="sm:max-w-80"
            placeholder="Research and Publication Division"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                add.mutate(newName.trim())
              }
            }}
          />
          <Button
            size="sm"
            disabled={!newName.trim() || add.isPending}
            onClick={() => add.mutate(newName.trim())}
          >
            {add.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add division
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
