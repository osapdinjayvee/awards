import { useMemo, useRef, useState } from "react"
import Papa from "papaparse"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { FileUp, Loader2, TriangleAlert, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { readCsvFile } from "@/lib/csv"
import { supabase } from "@/lib/supabase"
import {
  ALL_EMPLOYMENT_GROUPS,
  EMPLOYMENT_GROUP_LABELS,
  type EmploymentGroup,
} from "@/lib/types"

const NONE = "__none__"

/** Votes already cast for people in this roster — replacing it deletes them. */
function usePersonVoteCount(eventId: string) {
  return useQuery({
    queryKey: ["admin", "person-vote-count", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("votes")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .not("nominee_person_id", "is", null)
      if (error) throw error
      return count ?? 0
    },
  })
}

function guessGroup(value: string): EmploymentGroup | null {
  const v = value.toLowerCase()
  if (/jo|job\s*order|cos|contract/.test(v)) return "job_order_cos"
  if (/non[-_\s]?teach/.test(v)) return "permanent_non_teaching"
  if (/teach|faculty|instructor/.test(v)) return "permanent_teaching"
  if (/perm|regular/.test(v)) return "permanent_non_teaching"
  return null
}

function guessColumn(headers: string[], patterns: RegExp): string {
  return headers.find((h) => patterns.test(h)) ?? NONE
}

export function RosterImport({ eventId }: { eventId: string }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pasteValue, setPasteValue] = useState("")
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [nameCol, setNameCol] = useState(NONE)
  const [positionCol, setPositionCol] = useState(NONE)
  const [classCol, setClassCol] = useState(NONE)
  const [fallbackGroup, setFallbackGroup] = useState<EmploymentGroup>("permanent_teaching")
  const [valueMap, setValueMap] = useState<Record<string, EmploymentGroup>>({})
  const { data: personVotes = 0 } = usePersonVoteCount(eventId)
  const [replace, setReplace] = useState(true)
  const votesAtRisk = replace ? personVotes : 0

  function loadParsed(data: Record<string, string>[], fields: string[]) {
    const cleaned = data.filter((r) =>
      Object.values(r).some((v) => v && v.trim()),
    )
    setRows(cleaned)
    setHeaders(fields)
    const name = guessColumn(fields, /name/i)
    const pos = guessColumn(fields, /position|designation|title/i)
    const cls = guessColumn(fields, /class|group|status|type|category/i)
    setNameCol(name)
    setPositionCol(pos)
    setClassCol(cls)
    if (cls !== NONE) {
      const distinct = [...new Set(cleaned.map((r) => (r[cls] ?? "").trim()).filter(Boolean))]
      const map: Record<string, EmploymentGroup> = {}
      for (const v of distinct) {
        const guess = guessGroup(v)
        if (guess) map[v] = guess
      }
      setValueMap(map)
    }
    if (name === NONE) {
      toast.warning("Could not detect a name column — pick it below.")
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    try {
      const text = await readCsvFile(file)
      const res = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: "greedy",
      })
      loadParsed(res.data, res.meta.fields ?? [])
    } catch {
      toast.error("Could not read that file as CSV.")
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  function onPaste() {
    if (!pasteValue.trim()) return
    const res = Papa.parse<Record<string, string>>(pasteValue.trim(), {
      header: true,
      skipEmptyLines: "greedy",
    })
    loadParsed(res.data, res.meta.fields ?? [])
  }

  const distinctClassValues = useMemo(() => {
    if (classCol === NONE) return []
    return [...new Set(rows.map((r) => (r[classCol] ?? "").trim()).filter(Boolean))]
  }, [rows, classCol])

  const prepared = useMemo(() => {
    if (nameCol === NONE) return []
    return rows
      .map((r) => {
        const full_name = (r[nameCol] ?? "").trim()
        if (!full_name) return null
        const position =
          positionCol !== NONE ? (r[positionCol] ?? "").trim() || null : null
        const rawClass = classCol !== NONE ? (r[classCol] ?? "").trim() : ""
        const classification =
          (rawClass && valueMap[rawClass]) || fallbackGroup
        return { event_id: eventId, full_name, position, classification }
      })
      .filter(Boolean) as {
      event_id: string
      full_name: string
      position: string | null
      classification: EmploymentGroup
    }[]
  }, [rows, nameCol, positionCol, classCol, valueMap, fallbackGroup, eventId])

  const unmapped = distinctClassValues.filter((v) => !valueMap[v])

  const importMutation = useMutation({
    mutationFn: async () => {
      if (replace) {
        const { error } = await supabase
          .from("roster_people")
          .delete()
          .eq("event_id", eventId)
        if (error) throw error
      }
      for (let i = 0; i < prepared.length; i += 500) {
        const { error } = await supabase
          .from("roster_people")
          .insert(prepared.slice(i, i + 500))
        if (error) throw error
      }
      return prepared.length
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["admin", "roster", eventId] })
      qc.invalidateQueries({ queryKey: ["roster", eventId] })
      toast.success(`Imported ${count} people.`)
      setRows([])
      setHeaders([])
      setPasteValue("")
    },
    onError: () => toast.error("Import failed — nothing may have been saved. Try again."),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Import roster</CardTitle>
        <CardDescription>
          Upload a CSV, or copy the cells straight from Excel and paste them
          below (headers included).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start gap-4">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <FileUp className="size-4" /> Choose CSV file
          </Button>
          <div className="min-w-64 flex-1 space-y-2">
            <Textarea
              rows={3}
              placeholder={"Or paste from Excel here...\nName\tPosition\tStatus"}
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onPaste}
              disabled={!pasteValue.trim()}
            >
              Parse pasted data
            </Button>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">
              {rows.length} rows found. Map the columns:
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {(
                [
                  ["Full name", nameCol, setNameCol],
                  ["Position", positionCol, setPositionCol],
                  ["Classification", classCol, setClassCol],
                ] as const
              ).map(([label, value, setter]) => (
                <div key={label} className="grid gap-2">
                  <Label>{label}</Label>
                  <Select value={value} onValueChange={setter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— none —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {classCol === NONE ? (
              <div className="grid max-w-xs gap-2">
                <Label>All imported rows are</Label>
                <Select
                  value={fallbackGroup}
                  onValueChange={(v) => setFallbackGroup(v as EmploymentGroup)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_EMPLOYMENT_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {EMPLOYMENT_GROUP_LABELS[g]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              distinctClassValues.length > 0 && (
                <div className="space-y-2">
                  <Label>Map classification values</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {distinctClassValues.map((v) => (
                      <div
                        key={v}
                        className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5"
                      >
                        <span className="truncate text-sm">{v}</span>
                        <Select
                          value={valueMap[v] ?? ""}
                          onValueChange={(g) =>
                            setValueMap({ ...valueMap, [v]: g as EmploymentGroup })
                          }
                        >
                          <SelectTrigger className="w-44 shrink-0">
                            <SelectValue placeholder="Pick group..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_EMPLOYMENT_GROUPS.map((g) => (
                              <SelectItem key={g} value={g}>
                                {EMPLOYMENT_GROUP_LABELS[g]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  {unmapped.length > 0 && (
                    <p className="text-xs text-amber-600">
                      Unmapped values fall back to{" "}
                      {EMPLOYMENT_GROUP_LABELS[fallbackGroup]}.
                    </p>
                  )}
                </div>
              )
            )}

            {prepared.length > 0 && (
              <>
                <div className="max-h-56 overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Group</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prepared.slice(0, 10).map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{p.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.position ?? "—"}
                          </TableCell>
                          <TableCell>
                            {EMPLOYMENT_GROUP_LABELS[p.classification]}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Showing first 10 of {prepared.length} people to import.
                </p>
                {votesAtRisk > 0 && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                  >
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>
                      This event already has {votesAtRisk} vote
                      {votesAtRisk === 1 ? "" : "s"} for people in the roster.
                      Replacing it deletes those ballots — switch Replace off to
                      append instead.
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={replace} onCheckedChange={setReplace} />
                    Replace existing roster (off = append)
                  </label>
                  <Button
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending || nameCol === NONE}
                  >
                    {importMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    Import {prepared.length} people
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
