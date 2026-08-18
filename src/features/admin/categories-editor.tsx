import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { GripVertical, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import {
  ALL_EMPLOYMENT_GROUPS,
  EMPLOYMENT_GROUP_LABELS,
  type CategoryType,
  type CategoryWithCriteria,
  type EmploymentGroup,
} from "@/lib/types"

type CriterionDraft = {
  id?: string
  name: string
  description: string
  weight: string
}

type CategoryDraft = {
  id?: string
  name: string
  type: CategoryType
  description: string
  eligible_groups: EmploymentGroup[]
  criteria: CriterionDraft[]
}

const EMPTY_DRAFT: CategoryDraft = {
  name: "",
  type: "individual",
  description: "",
  eligible_groups: [],
  criteria: [{ name: "", description: "", weight: "" }],
}

function useAdminCategories(eventId: string) {
  return useQuery({
    queryKey: ["admin", "categories", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("award_categories")
        .select("*, criteria(*)")
        .eq("event_id", eventId)
        .order("sort_order")
      if (error) throw error
      return (data as CategoryWithCriteria[]).map((c) => ({
        ...c,
        criteria: [...c.criteria].sort((a, b) => a.sort_order - b.sort_order),
      }))
    },
  })
}

export function CategoriesEditor({ eventId }: { eventId: string }) {
  const qc = useQueryClient()
  const { data: categories, isLoading } = useAdminCategories(eventId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<CategoryDraft>(EMPTY_DRAFT)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "categories", eventId] })
    qc.invalidateQueries({ queryKey: ["event", "slug"] })
  }

  const save = useMutation({
    mutationFn: async (d: CategoryDraft) => {
      const categoryPayload = {
        event_id: eventId,
        name: d.name.trim(),
        type: d.type,
        description: d.description.trim() || null,
        eligible_groups:
          d.type === "individual" && d.eligible_groups.length > 0
            ? d.eligible_groups
            : null,
      }
      let categoryId = d.id
      if (categoryId) {
        const { error } = await supabase
          .from("award_categories")
          .update(categoryPayload)
          .eq("id", categoryId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("award_categories")
          .insert({
            ...categoryPayload,
            sort_order: (categories?.length ?? 0) + 1,
          })
          .select()
          .single()
        if (error) throw error
        categoryId = data.id as string
      }

      // Reconcile criteria: delete removed, upsert the rest with fresh sort order.
      const keptIds = d.criteria.filter((c) => c.id).map((c) => c.id!)
      const { error: delErr } = await supabase
        .from("criteria")
        .delete()
        .eq("category_id", categoryId)
        .not("id", "in", `(${keptIds.length ? keptIds.join(",") : "00000000-0000-0000-0000-000000000000"})`)
      if (delErr) throw delErr

      const rows = d.criteria
        .filter((c) => c.name.trim())
        .map((c, i) => ({
          ...(c.id ? { id: c.id } : {}),
          category_id: categoryId!,
          name: c.name.trim(),
          description: c.description.trim() || null,
          weight: Number(c.weight) || 0,
          sort_order: i + 1,
        }))
      if (rows.length > 0) {
        const { error } = await supabase.from("criteria").upsert(rows)
        if (error) throw error
      }
    },
    onSuccess: () => {
      invalidate()
      setDialogOpen(false)
      toast.success("Category saved.")
    },
    onError: () => toast.error("Could not save the category."),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("award_categories").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      toast.success("Category deleted.")
    },
    onError: () =>
      toast.error("Could not delete — it may already have nominations."),
  })

  function openNew() {
    setDraft(EMPTY_DRAFT)
    setDialogOpen(true)
  }

  function openEdit(cat: CategoryWithCriteria) {
    setDraft({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      description: cat.description ?? "",
      eligible_groups: cat.eligible_groups ?? [],
      criteria: cat.criteria.length
        ? cat.criteria.map((cr) => ({
            id: cr.id,
            name: cr.name,
            description: cr.description ?? "",
            weight: String(Number(cr.weight)),
          }))
        : [{ name: "", description: "", weight: "" }],
    })
    setDialogOpen(true)
  }

  const weightSum = draft.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      {!categories || categories.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No award categories yet.
        </p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {cat.name}
                    <Badge variant="outline">
                      {cat.type === "team" ? "Team / Unit" : "Individual"}
                    </Badge>
                  </CardTitle>
                  {cat.eligible_groups && cat.eligible_groups.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Eligible:{" "}
                      {cat.eligible_groups
                        .map((g) => EMPLOYMENT_GROUP_LABELS[g])
                        .join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${cat.name}`}
                  onClick={() => openEdit(cat)}
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the category, its criteria, and any
                        nominations submitted to it. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(cat.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              {cat.criteria.length > 0 && (
                <CardContent className="pt-0">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {cat.criteria.map((cr) => (
                      <li key={cr.id} className="flex justify-between gap-3">
                        <span>{cr.name}</span>
                        <span className="tabular-nums">{Number(cr.weight)}%</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="grid gap-2">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={draft.type}
                  onValueChange={(v) =>
                    setDraft({ ...draft, type: v as CategoryType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="team">Team / Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                rows={3}
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </div>

            {draft.type === "individual" && (
              <div className="grid gap-2">
                <Label>Who can be nominated</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_EMPLOYMENT_GROUPS.map((g) => {
                    const active = draft.eligible_groups.includes(g)
                    return (
                      <Button
                        key={g}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            eligible_groups: active
                              ? draft.eligible_groups.filter((x) => x !== g)
                              : [...draft.eligible_groups, g],
                          })
                        }
                      >
                        {EMPLOYMENT_GROUP_LABELS[g]}
                      </Button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave all unselected to allow every employment group.
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Criteria</Label>
                <span
                  className={
                    weightSum === 100
                      ? "text-xs text-muted-foreground"
                      : "text-xs font-medium text-amber-600"
                  }
                >
                  Weights sum: {weightSum}%{weightSum !== 100 && " (usually 100%)"}
                </span>
              </div>
              <div className="space-y-3">
                {draft.criteria.map((cr, i) => (
                  <div key={i} className="grid gap-2 rounded-md border p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_90px_32px]">
                      <Input
                        placeholder="Criterion name"
                        value={cr.name}
                        onChange={(e) => {
                          const next = [...draft.criteria]
                          next[i] = { ...cr, name: e.target.value }
                          setDraft({ ...draft, criteria: next })
                        }}
                      />
                      <Input
                        placeholder="%"
                        inputMode="numeric"
                        value={cr.weight}
                        onChange={(e) => {
                          const next = [...draft.criteria]
                          next[i] = {
                            ...cr,
                            weight: e.target.value.replace(/[^0-9.]/g, ""),
                          }
                          setDraft({ ...draft, criteria: next })
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove criterion"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            criteria: draft.criteria.filter((_, x) => x !== i),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Short description (optional)"
                      rows={2}
                      value={cr.description}
                      onChange={(e) => {
                        const next = [...draft.criteria]
                        next[i] = { ...cr, description: e.target.value }
                        setDraft({ ...draft, criteria: next })
                      }}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      criteria: [
                        ...draft.criteria,
                        { name: "", description: "", weight: "" },
                      ],
                    })
                  }
                >
                  <Plus className="size-4" /> Add criterion
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => save.mutate(draft)}
              disabled={save.isPending || !draft.name.trim()}
            >
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              Save category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
