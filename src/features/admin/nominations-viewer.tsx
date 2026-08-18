import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Download, FileText, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toCsv, downloadCsv } from "@/lib/csv"
import { supabase } from "@/lib/supabase"
import {
  EMPLOYMENT_GROUP_LABELS,
  type AwardCategory,
  type AwardEvent,
  type Nomination,
  type NominationAttachment,
  type RosterPerson,
  type Unit,
} from "@/lib/types"

const ALL = "__all__"

type NominationRow = Nomination & {
  award_categories: Pick<AwardCategory, "id" | "name" | "type"> | null
  roster_people: Pick<RosterPerson, "full_name" | "position" | "classification"> | null
  units: Pick<Unit, "name"> | null
  nomination_attachments: NominationAttachment[]
}

function useNominations(eventId: string) {
  return useQuery({
    queryKey: ["admin", "nominations", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nominations")
        .select(
          "*, award_categories(id, name, type), roster_people(full_name, position, classification), units(name), nomination_attachments(*)",
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as NominationRow[]
    },
  })
}

function nomineeName(n: NominationRow): string {
  return n.roster_people?.full_name ?? n.units?.name ?? "(deleted nominee)"
}

export function NominationsViewer({ event }: { event: AwardEvent }) {
  const { data: nominations, isLoading } = useNominations(event.id)
  const [categoryFilter, setCategoryFilter] = useState(ALL)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<NominationRow | null>(null)

  const categories = useMemo(() => {
    const map = new Map<string, string>()
    for (const n of nominations ?? []) {
      if (n.award_categories) map.set(n.award_categories.id, n.award_categories.name)
    }
    return [...map.entries()]
  }, [nominations])

  const filtered = useMemo(() => {
    let rows = nominations ?? []
    if (categoryFilter !== ALL) {
      rows = rows.filter((n) => n.category_id === categoryFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (n) =>
          nomineeName(n).toLowerCase().includes(q) ||
          n.nominator_name.toLowerCase().includes(q) ||
          n.nominator_email.toLowerCase().includes(q),
      )
    }
    return rows
  }, [nominations, categoryFilter, search])

  function exportCsv() {
    const rows = filtered.map((n) => [
      n.award_categories?.name ?? "",
      nomineeName(n),
      n.roster_people?.position ?? "",
      n.roster_people
        ? EMPLOYMENT_GROUP_LABELS[n.roster_people.classification]
        : n.units
          ? "Unit / Team"
          : "",
      n.nominator_name,
      n.nominator_email,
      n.justification,
      String(n.nomination_attachments.length),
      new Date(n.created_at).toLocaleString(),
    ])
    const csv = toCsv(
      [
        "Category",
        "Nominee",
        "Position",
        "Group",
        "Nominator",
        "Nominator Email",
        "Justification",
        "Attachments",
        "Submitted",
      ],
      rows,
    )
    downloadCsv(`${event.slug}-nominations.csv`, csv)
  }

  async function openAttachment(att: NominationAttachment) {
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(att.storage_path, 3600)
    if (error || !data) {
      toast.error("Could not open the attachment.")
      return
    }
    window.open(data.signedUrl, "_blank", "noreferrer")
  }

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search nominee or nominator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={filtered.length === 0}
        >
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {nominations?.length
            ? "No nominations match the current filter."
            : "No nominations yet."}
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Nominee</TableHead>
                <TableHead>Nominator</TableHead>
                <TableHead className="text-right">Files</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((n) => (
                <TableRow
                  key={n.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(n)}
                >
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm">
                    {n.award_categories?.name ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">{nomineeName(n)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {n.nominator_name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {n.nomination_attachments.length || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {filtered.length} of {nominations?.length ?? 0} nominations shown
      </p>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{nomineeName(selected)}</DialogTitle>
                <DialogDescription>
                  {selected.award_categories?.name}
                  {selected.roster_people?.position && (
                    <> · {selected.roster_people.position}</>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                {selected.roster_people && (
                  <Badge variant="outline">
                    {EMPLOYMENT_GROUP_LABELS[selected.roster_people.classification]}
                  </Badge>
                )}
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Nominated by
                  </p>
                  <p>
                    {selected.nominator_name}{" "}
                    <span className="text-muted-foreground">
                      ({selected.nominator_email})
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Justification
                  </p>
                  <p className="whitespace-pre-wrap">{selected.justification}</p>
                </div>
                {selected.nomination_attachments.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Attachments
                    </p>
                    <ul className="space-y-1.5">
                      {selected.nomination_attachments.map((att) => (
                        <li key={att.id}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md border px-3 py-1.5 text-left hover:bg-accent"
                            onClick={() => openAttachment(att)}
                          >
                            <FileText className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">
                              {att.file_name ?? att.storage_path}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
