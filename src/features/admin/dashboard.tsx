import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import { ExternalLink, Loader2, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { slugify, useAdminEvents, useCreateEvent } from "@/hooks/use-admin"
import type { EventStatus } from "@/lib/types"

const STATUS_VARIANT: Record<EventStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  open: "default",
  closed: "secondary",
  archived: "secondary",
}

export function Dashboard() {
  const { data: events, isLoading } = useAdminEvents()
  const createEvent = useCreateEvent()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const event = await createEvent.mutateAsync({ title, slug })
      setDialogOpen(false)
      navigate(`/admin/events/${event.id}`)
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("duplicate")
          ? "That URL slug is already in use."
          : "Could not create the event."
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Events</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> New event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create award event</DialogTitle>
              <DialogDescription>
                Starts as a draft — publish it when it's ready.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onCreate} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-title">Title</Label>
                <Input
                  id="new-title"
                  value={title}
                  placeholder="PRAISEC Awards 2027"
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (!slugTouched) setSlug(slugify(e.target.value))
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-slug">URL slug</Label>
                <Input
                  id="new-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                />
                <p className="text-xs text-muted-foreground">
                  Public link: /e/{slug || "..."}
                </p>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createEvent.isPending}>
                  {createEvent.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !events || events.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No events yet. Create your first award event to get started.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Closes</TableHead>
                <TableHead className="text-right">Nominations</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link
                      to={`/admin/events/${e.id}`}
                      className="font-medium hover:underline"
                    >
                      {e.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">/e/{e.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[e.status]}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.closes_at
                      ? new Date(e.closes_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {e.nominations?.[0]?.count ?? 0}
                  </TableCell>
                  <TableCell className="w-10">
                    {(e.status === "open" || e.status === "closed") && (
                      <Button asChild variant="ghost" size="icon-sm" aria-label="Open public page">
                        <a href={`/e/${e.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
