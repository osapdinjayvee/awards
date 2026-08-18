import { useState } from "react"
import { toast } from "sonner"
import { IdCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { looksLikeFullName } from "@/lib/voter"
import { useVerifyVoter, votingErrorMessage, type VerifyResult } from "@/hooks/use-voting"
import type { AwardEvent } from "@/lib/types"

export function VoterGate({
  event,
  onVerified,
}: {
  event: AwardEvent
  onVerified: (idNumber: string, name: string, result: VerifyResult) => void
}) {
  const verify = useVerifyVoter(event.id)
  const [idNumber, setIdNumber] = useState("")
  const [name, setName] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!idNumber.trim()) {
      toast.error("Please enter your ID number.")
      return
    }
    if (!looksLikeFullName(name)) {
      toast.error("Please enter your full name (first and last name).")
      return
    }
    try {
      const result = await verify.mutateAsync({ idNumber, name })
      onVerified(idNumber, name, result)
    } catch (err) {
      toast.error(votingErrorMessage(err))
    }
  }

  return (
    <Dialog open>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <IdCard className="size-5" />
          </div>
          <DialogTitle className="font-heading text-xl">
            Verify to vote
          </DialogTitle>
          <DialogDescription>
            Voting for {event.title} is open to listed personnel only. Enter
            your employee ID number and full name as they appear on record.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="voter-id">ID number</Label>
            <Input
              id="voter-id"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="e.g. EMP-0001"
              autoComplete="off"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="voter-name">Full name</Label>
            <Input
              id="voter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jayvee Osapdin"
              autoComplete="name"
              required
            />
            <p className="text-xs text-muted-foreground">
              Any order works — "Jayvee Osapdin" and "Osapdin, Jayvee M." are
              both fine.
            </p>
          </div>
          <Button type="submit" disabled={verify.isPending} className="w-full">
            {verify.isPending && <Loader2 className="size-4 animate-spin" />}
            Start voting
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
