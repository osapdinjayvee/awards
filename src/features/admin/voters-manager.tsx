import { useMemo, useRef, useState } from "react"
import Papa from "papaparse"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { FileUp, Loader2, Search, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { matchesTokens, normalizeForSearch, searchTokens } from "@/lib/search"
import { supabase } from "@/lib/supabase"
import type { Voter } from "@/lib/types"

const NONE = "__none__"

function guessColumn(headers: string[], patterns: RegExp): string {
  return headers.find((h) => patterns.test(h)) ?? NONE
}

function useAdminVoters(eventId: string) {
  return useQuery({
    queryKey: ["admin", "voters", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voters")
        .select("*")
        .eq("event_id", eventId)
        .order("full_name")
      if (error) throw error
      return data as Voter[]
    },
  })
}

export function VotersManager({ eventId }: { eventId: string }) {
  const qc = useQueryClient()
  const { data: voters, isLoading } = useAdminVoters(eventId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pasteValue, setPasteValue] = useState("")
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [idCol, setIdCol] = useState(NONE)
  const [nameCol, setNameCol] = useState(NONE)
  const [replace, setReplace] = useState(false)
  const [search, setSearch] = useState("")

  function loadParsed(data: Record<string, string>[], fields: string[]) {
    const cleaned = data.filter((r) =>
      Object.values(r).some((v) => v && v.trim()),
    )
    setRows(cleaned)
    setHeaders(fields)
    setIdCol(guessColumn(fields, /id|number|no\.?$/i))
    setNameCol(guessColumn(fields, /name/i))
  }

  function onFile(file: File | undefined) {
    if (!file) return
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (res) => loadParsed(res.data, res.meta.fields ?? []),
      error: () => toast.error("Could not parse that file as CSV."),
    })
    if (fileRef.current) fileRef.current.value = ""
  }

  const prepared = useMemo(() => {
    if (idCol === NONE || nameCol === NONE) return []
    const seen = new Set<string>()
    return rows
      .map((r) => {
        const id_number = (r[idCol] ?? "").trim()
        const full_name = (r[nameCol] ?? "").trim()
        if (!id_number || !full_name) return null
        const norm = id_number.toLowerCase().replace(/[^a-z0-9]/g, "")
        if (!norm || seen.has(norm)) return null
        seen.add(norm)
        return { event_id: eventId, id_number, full_name }
      })
      .filter(Boolean) as { event_id: string; id_number: string; full_name: string }[]
  }, [rows, idCol, nameCol, eventId])

  const importMutation = useMutation({
    mutationFn: async () => {
      if (replace) {
        const { error } = await supabase
          .from("voters")
          .delete()
          .eq("event_id", eventId)
        if (error) throw error
      }
      for (let i = 0; i < prepared.length; i += 500) {
        const { error } = await supabase
          .from("voters")
          .insert(prepared.slice(i, i + 500))
        if (error) throw error
      }
      return prepared.length
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["admin", "voters", eventId] })
      toast.success(`Imported ${count} voters.`)
      setRows([])
      setHeaders([])
      setPasteValue("")
    },
    onError: (err) => {
      const msg =
        err instanceof Error && err.message.includes("duplicate")
          ? "Some ID numbers already exist for this event. Use Replace, or remove the duplicates."
          : "Import failed. Nothing may have been saved — try again."
      toast.error(msg)
    },
  })

  const removeVoter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("voters").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "voters", eventId] }),
    onError: () => toast.error("Could not remove — they may have votes recorded."),
  })

  const filtered = useMemo(() => {
    if (!voters) return []
    const tokens = searchTokens(search)
    if (tokens.length === 0) return voters
    return voters.filter((v) =>
      matchesTokens(
        normalizeForSearch(`${v.full_name} ${v.id_number}`),
        tokens,
      ),
    )
  }, [voters, search])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import voter list</CardTitle>
          <CardDescription>
            Two columns: ID number and full name. Upload a CSV or paste the
            cells straight from Excel (headers included). Only people on this
            list can vote.
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
                placeholder={"Or paste from Excel here...\nID Number\tName"}
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!pasteValue.trim()}
                onClick={() => {
                  const res = Papa.parse<Record<string, string>>(
                    pasteValue.trim(),
                    { header: true, skipEmptyLines: "greedy" },
                  )
                  loadParsed(res.data, res.meta.fields ?? [])
                }}
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
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["ID number", idCol, setIdCol],
                    ["Full name", nameCol, setNameCol],
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

              {prepared.length > 0 && (
                <>
                  <div className="max-h-48 overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID number</TableHead>
                          <TableHead>Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prepared.slice(0, 8).map((v, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">
                              {v.id_number}
                            </TableCell>
                            <TableCell>{v.full_name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Showing first 8 of {prepared.length} voters to import
                    (duplicate IDs within the paste are dropped).
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={replace} onCheckedChange={setReplace} />
                      Replace existing list (off = append)
                    </label>
                    <Button
                      onClick={() => importMutation.mutate()}
                      disabled={importMutation.isPending}
                    >
                      {importMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                      Import {prepared.length} voters
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Authorized voters ({voters?.length ?? 0})
          </CardTitle>
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search name or ID..."
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
              {search
                ? "No matches."
                : "No voters yet — import the ID list above."}
            </p>
          ) : (
            <div className="max-h-96 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">
                        {v.id_number}
                      </TableCell>
                      <TableCell className="font-medium">{v.full_name}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${v.full_name}`}
                          onClick={() => removeVoter.mutate(v.id)}
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
    </div>
  )
}
