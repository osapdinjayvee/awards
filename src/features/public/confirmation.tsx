import { Link, useLocation, useOutletContext } from "react-router"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AwardEvent, CategoryWithCriteria } from "@/lib/types"

type Ctx = { event: AwardEvent; categories: CategoryWithCriteria[] }

export function Confirmation() {
  const { event } = useOutletContext<Ctx>()
  const state = useLocation().state as
    | { categoryName?: string; nomineeName?: string }
    | null

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
      <CheckCircle2 className="size-14 text-primary" />
      <h1 className="text-2xl font-bold">Nomination submitted</h1>
      <p className="text-muted-foreground">
        {state?.nomineeName ? (
          <>
            Thank you for nominating <strong>{state.nomineeName}</strong>
            {state.categoryName && (
              <>
                {" "}
                for <strong>{state.categoryName}</strong>
              </>
            )}
            .
          </>
        ) : (
          "Thank you — your nomination has been received."
        )}{" "}
        The committee will review all submissions after nominations close.
      </p>
      <Button asChild>
        <Link to={`/e/${event.slug}`}>Nominate someone else</Link>
      </Button>
    </div>
  )
}
