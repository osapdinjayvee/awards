import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Languages, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { LANG_LABELS, type Lang } from "@/lib/i18n"
import type { AwardEvent, CategoryWithCriteria } from "@/lib/types"

/** Languages an admin can fill in — English is the source text. */
const TRANSLATABLE: Lang[] = ["tl", "taglish"]

type Table = "events" | "award_categories" | "criteria"
type Row = { table: Table; id: string; field: string; english: string }
type DraftKey = string // `${table}:${id}:${field}`

const keyOf = (r: Row): DraftKey => `${r.table}:${r.id}:${r.field}`

function useTranslatableContent(eventId: string) {
  return useQuery({
    queryKey: ["admin", "translations", eventId],
    queryFn: async () => {
      const [event, categories] = await Promise.all([
        supabase.from("events").select("*").eq("id", eventId).single(),
        supabase
          .from("award_categories")
          .select("*, criteria(*)")
          .eq("event_id", eventId)
          .order("sort_order"),
      ])
      if (event.error) throw event.error
      if (categories.error) throw categories.error
      return {
        event: event.data as AwardEvent,
        categories: (categories.data as CategoryWithCriteria[]).map((c) => ({
          ...c,
          criteria: [...c.criteria].sort((a, b) => a.sort_order - b.sort_order),
        })),
      }
    },
  })
}

/**
 * Fills the i18n jsonb column on events, categories and criteria. Anything left
 * blank falls back to the English source on the public pages.
 */
export function TranslationsEditor({ eventId }: { eventId: string }) {
  const qc = useQueryClient()
  const { data, isLoading } = useTranslatableContent(eventId)
  const [lang, setLang] = useState<Lang>("tl")
  const [draft, setDraft] = useState<Record<DraftKey, string>>({})

  /** Every translatable string, grouped for display. */
  const groups = useMemo(() => {
    if (!data) return []
    const out: { title: string; rows: Row[] }[] = []
    const eventRows: Row[] = []
    if (data.event.description)
      eventRows.push({
        table: "events",
        id: data.event.id,
        field: "description",
        english: data.event.description,
      })
    if (data.event.welcome_text)
      eventRows.push({
        table: "events",
        id: data.event.id,
        field: "welcome_text",
        english: data.event.welcome_text,
      })
    if (eventRows.length) out.push({ title: "Event copy", rows: eventRows })

    for (const cat of data.categories) {
      const rows: Row[] = [
        {
          table: "award_categories",
          id: cat.id,
          field: "name",
          english: cat.name,
        },
      ]
      if (cat.description)
        rows.push({
          table: "award_categories",
          id: cat.id,
          field: "description",
          english: cat.description,
        })
      for (const c of cat.criteria) {
        rows.push({ table: "criteria", id: c.id, field: "name", english: c.name })
        if (c.description)
          rows.push({
            table: "criteria",
            id: c.id,
            field: "description",
            english: c.description,
          })
      }
      out.push({ title: cat.name, rows })
    }
    return out
  }, [data])

  /** Saved translation for a row in the current language. */
  function saved(row: Row): string {
    if (!data) return ""
    const source =
      row.table === "events"
        ? data.event
        : row.table === "award_categories"
          ? data.categories.find((c) => c.id === row.id)
          : data.categories
              .flatMap((c) => c.criteria)
              .find((c) => c.id === row.id)
    return source?.i18n?.[lang]?.[row.field] ?? ""
  }

  const value = (row: Row) => draft[`${keyOf(row)}:${lang}`] ?? saved(row)
  const dirtyCount = Object.keys(draft).filter((k) =>
    k.endsWith(`:${lang}`),
  ).length

  const save = useMutation({
    mutationFn: async () => {
      if (!data) return
      // Collect changed fields per row, then merge into that row's i18n.
      const byRow = new Map<string, Record<string, string>>()
      for (const [key, text] of Object.entries(draft)) {
        const [table, id, field, l] = key.split(":")
        if (l !== lang) continue
        const rowKey = `${table}:${id}`
        byRow.set(rowKey, { ...(byRow.get(rowKey) ?? {}), [field]: text.trim() })
      }
      for (const [rowKey, fields] of byRow) {
        const [table, id] = rowKey.split(":") as [Table, string]
        const current =
          table === "events"
            ? data.event.i18n
            : table === "award_categories"
              ? data.categories.find((c) => c.id === id)?.i18n
              : data.categories
                  .flatMap((c) => c.criteria)
                  .find((c) => c.id === id)?.i18n
        const merged = {
          ...(current ?? {}),
          [lang]: { ...(current?.[lang] ?? {}), ...fields },
        }
        const { error } = await supabase
          .from(table)
          .update({ i18n: merged })
          .eq("id", id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      setDraft((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([k]) => !k.endsWith(`:${lang}`)),
        ),
      )
      qc.invalidateQueries({ queryKey: ["admin", "translations", eventId] })
      qc.invalidateQueries({ queryKey: ["event", "slug"] })
      toast.success(`${LANG_LABELS[lang]} translations saved.`)
    },
    onError: () => toast.error("Could not save the translations."),
  })

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const total = groups.reduce((n, g) => n + g.rows.length, 0)
  const filled = groups.reduce(
    (n, g) => n + g.rows.filter((r) => value(r).trim() !== "").length,
    0,
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Tabs value={lang} onValueChange={(v) => setLang(v as Lang)}>
            <TabsList>
              {TRANSLATABLE.map((l) => (
                <TabsTrigger key={l} value={l}>
                  {LANG_LABELS[l]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground">
            {filled} of {total} translated
          </p>
        </div>
        <Button
          size="sm"
          disabled={dirtyCount === 0 || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save {dirtyCount > 0 ? `${dirtyCount} change${dirtyCount === 1 ? "" : "s"}` : ""}
        </Button>
      </div>

      <p className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
        <Languages className="mt-0.5 size-4 shrink-0" />
        Leave a field blank to show the English text in that language. Award
        titles are usually left untranslated — they are proper names.
      </p>

      {groups.map((group) => (
        <Card key={group.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group.title}</CardTitle>
            <CardDescription>
              {group.rows.length} field{group.rows.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.rows.map((row) => (
              <div key={keyOf(row)} className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {row.field.replace("_", " ")} · English
                  </p>
                  <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {row.english}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {LANG_LABELS[lang]}
                  </p>
                  <Textarea
                    rows={3}
                    value={value(row)}
                    placeholder={`${LANG_LABELS[lang]} translation...`}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [`${keyOf(row)}:${lang}`]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
