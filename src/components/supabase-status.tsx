import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { checkSupabaseConnection } from "@/lib/supabase"

type Status =
  | { state: "checking" }
  | { state: "connected" }
  | { state: "error"; message: string }

export function SupabaseStatus() {
  const [status, setStatus] = useState<Status>({ state: "checking" })

  useEffect(() => {
    let cancelled = false
    checkSupabaseConnection()
      .then(() => !cancelled && setStatus({ state: "connected" }))
      .catch(
        (err: unknown) =>
          !cancelled &&
          setStatus({
            state: "error",
            message: err instanceof Error ? err.message : String(err),
          }),
      )
    return () => {
      cancelled = true
    }
  }, [])

  if (status.state === "checking") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Checking Supabase connection…
      </p>
    )
  }

  if (status.state === "error") {
    return (
      <p className="flex items-center gap-2 text-sm text-destructive">
        <XCircle className="size-4" />
        Supabase not connected — {status.message}
      </p>
    )
  }

  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <CheckCircle2 className="size-4 text-emerald-600" />
      Connected to Supabase
    </p>
  )
}
