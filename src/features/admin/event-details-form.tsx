import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { slugify, useUpdateEvent } from "@/hooks/use-admin"
import type { AwardEvent, EventStatus } from "@/lib/types"

/** timestamptz -> value usable by <input type="datetime-local"> (local time) */
function toLocalInput(ts: string | null): string {
  if (!ts) return ""
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(v: string): string | null {
  return v ? new Date(v).toISOString() : null
}

const TRANSITIONS: Record<EventStatus, { to: EventStatus; label: string; description: string }[]> = {
  draft: [
    {
      to: "open",
      label: "Publish",
      description:
        "The event becomes publicly visible and starts accepting nominations (within the open/close dates).",
    },
  ],
  open: [
    {
      to: "closed",
      label: "Close nominations",
      description:
        "The public page stays visible with a closed notice; no new nominations are accepted.",
    },
  ],
  closed: [
    {
      to: "open",
      label: "Reopen",
      description: "The event starts accepting nominations again.",
    },
    {
      to: "archived",
      label: "Archive",
      description: "The event is hidden from the public entirely.",
    },
  ],
  archived: [
    {
      to: "closed",
      label: "Unarchive",
      description: "The event becomes publicly visible again with a closed notice.",
    },
  ],
}

export function EventDetailsForm({ event }: { event: AwardEvent }) {
  const update = useUpdateEvent(event.id)
  const [form, setForm] = useState({
    title: event.title,
    slug: event.slug,
    description: event.description ?? "",
    welcome_text: event.welcome_text ?? "",
    opens_at: toLocalInput(event.opens_at),
    closes_at: toLocalInput(event.closes_at),
  })

  useEffect(() => {
    setForm({
      title: event.title,
      slug: event.slug,
      description: event.description ?? "",
      welcome_text: event.welcome_text ?? "",
      opens_at: toLocalInput(event.opens_at),
      closes_at: toLocalInput(event.closes_at),
    })
  }, [event])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      await update.mutateAsync({
        title: form.title,
        slug: form.slug,
        description: form.description || null,
        welcome_text: form.welcome_text || null,
        opens_at: fromLocalInput(form.opens_at),
        closes_at: fromLocalInput(form.closes_at),
      })
      toast.success("Event details saved.")
    } catch {
      toast.error("Could not save. Check the slug is unique and valid.")
    }
  }

  async function onTransition(to: EventStatus) {
    try {
      await update.mutateAsync({ status: to })
      toast.success(`Event is now ${to}.`)
    } catch {
      toast.error("Could not change the event status.")
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="ev-title">Title</Label>
            <Input
              id="ev-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ev-slug">URL slug</Label>
            <Input
              id="ev-slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ev-desc">Description / rationale</Label>
          <Textarea
            id="ev-desc"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ev-welcome">Welcome text (shown in the hero)</Label>
          <Textarea
            id="ev-welcome"
            rows={3}
            value={form.welcome_text}
            onChange={(e) => setForm({ ...form, welcome_text: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="ev-opens">Nominations open</Label>
            <Input
              id="ev-opens"
              type="datetime-local"
              value={form.opens_at}
              onChange={(e) => setForm({ ...form, opens_at: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ev-closes">Nominations close</Label>
            <Input
              id="ev-closes"
              type="datetime-local"
              value={form.closes_at}
              onChange={(e) => setForm({ ...form, closes_at: e.target.value })}
            />
          </div>
        </div>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending && <Loader2 className="size-4 animate-spin" />}
          Save details
        </Button>
      </form>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Status</h3>
          <Badge>{event.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRANSITIONS[event.status].map((t) => (
            <AlertDialog key={t.to}>
              <AlertDialogTrigger asChild>
                <Button variant={t.to === "open" ? "default" : "outline"}>
                  {t.label}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.label}?</AlertDialogTitle>
                  <AlertDialogDescription>{t.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onTransition(t.to)}>
                    {t.label}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </div>
      </div>
    </div>
  )
}
