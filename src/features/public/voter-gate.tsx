import { useState } from "react"
import { Link } from "react-router"
import { CircleAlert, Loader2 } from "lucide-react"
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
import { eventLogo } from "@/lib/theme"
import { looksLikeFullName } from "@/lib/voter"
import { useVerifyVoter, votingErrorKey, type VerifyResult } from "@/hooks/use-voting"
import { useLang } from "@/hooks/use-lang"
import { LanguageSwitcher } from "@/components/language-switcher"
import type { AwardEvent } from "@/lib/types"

export function VoterGate({
  event,
  onVerified,
}: {
  event: AwardEvent
  onVerified: (idNumber: string, name: string, result: VerifyResult) => void
}) {
  const verify = useVerifyVoter(event.id)
  const { t } = useLang()
  const [idNumber, setIdNumber] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!idNumber.trim()) {
      setError(t("gate.errNoId"))
      return
    }
    if (!looksLikeFullName(name)) {
      setError(t("gate.errNoName"))
      return
    }
    try {
      const result = await verify.mutateAsync({ idNumber, name })
      onVerified(idNumber, name, result)
    } catch (err) {
      setError(t(votingErrorKey(err)))
    }
  }

  return (
    <Dialog open>
      <DialogContent
        className="overflow-hidden rounded-3xl p-0 sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="gap-3 border-b border-border/60 bg-linear-to-br from-primary/10 via-card/0 to-chart-2/8 px-6 pb-6 pt-7">
          <div className="flex items-start justify-between gap-3">
            <img
            src={eventLogo(event)}
            alt=""
              className="size-14 rounded-full bg-white object-contain p-1 shadow-sm ring-1 ring-border/60"
            />
            <LanguageSwitcher />
          </div>
          <DialogTitle className="font-heading text-2xl tracking-tight">
            {t("gate.title")}
          </DialogTitle>
          <DialogDescription className="text-pretty text-sm/relaxed">
            {t("gate.description", { title: event.title })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 px-6 pb-7">
          <div className="grid gap-2">
            <Label htmlFor="voter-id">{t("gate.idLabel")}</Label>
            <Input
              id="voter-id"
              className="h-11 rounded-xl"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="e.g. MMC-115"
              autoComplete="off"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="voter-name">{t("gate.nameLabel")}</Label>
            <Input
              id="voter-name"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jayvee Osapdin"
              autoComplete="name"
              required
            />
            <p className="text-xs text-muted-foreground">{t("gate.nameHint")}</p>
          </div>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={verify.isPending}
            className="mt-1 w-full rounded-full"
          >
            {verify.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("common.startVoting")}
          </Button>
          <Link
            to={`/e/${event.slug}`}
            className="text-center text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {t("common.backToAwards")}
          </Link>
        </form>
      </DialogContent>
    </Dialog>
  )
}
