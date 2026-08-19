import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Loader2, TriangleAlert } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDeleteEvent } from "@/hooks/use-admin"
import type { AwardEvent } from "@/lib/types"

/**
 * Destructive, irreversible: deleting an event takes its categories, roster,
 * units, voters, cast votes and nominations with it. Typing the slug is the
 * safety catch.
 */
export function DeleteEventDialog({
  event,
  trigger,
  onDeleted,
}: {
  event: Pick<AwardEvent, "id" | "slug" | "title">
  trigger: ReactNode
  onDeleted?: () => void
}) {
  const remove = useDeleteEvent()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")

  const matches = confirm.trim() === event.slug

  async function onConfirm() {
    if (!matches) return
    try {
      await remove.mutateAsync(event.id)
      setOpen(false)
      setConfirm("")
      toast.success(`"${event.title}" deleted.`)
      onDeleted?.()
    } catch {
      toast.error("Could not delete the event. Please try again.")
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (remove.isPending) return
        setOpen(next)
        if (!next) setConfirm("")
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <TriangleAlert className="size-5" />
          </div>
          <AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. Its categories and criteria, roster, units,
            authorized voters, every vote already cast, and all nominations with
            their attachments are deleted along with it.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="confirm-slug">
            Type <span className="font-mono font-semibold">{event.slug}</span>{" "}
            to confirm
          </Label>
          <Input
            id="confirm-slug"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            placeholder={event.slug}
          />
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={remove.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!matches || remove.isPending}
          >
            {remove.isPending && <Loader2 className="size-4 animate-spin" />}
            Delete event
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
