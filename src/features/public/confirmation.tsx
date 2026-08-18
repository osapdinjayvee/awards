import { Link, useLocation, useOutletContext } from "react-router"
import { Award, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AwardEvent, CategoryWithCriteria } from "@/lib/types"

type Ctx = { event: AwardEvent; categories: CategoryWithCriteria[] }

export function Confirmation() {
  const { event } = useOutletContext<Ctx>()
  const state = useLocation().state as
    | { categoryName?: string; nomineeName?: string }
    | null

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="rise-in relative">
        <span
          aria-hidden="true"
          className="absolute inset-0 -m-4 rounded-full border border-dashed border-primary/30"
        />
        <span className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <Check className="size-9" strokeWidth={2.5} />
        </span>
      </div>

      <div className="rise-in rise-in-delay-1 space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Nomination submitted
        </h1>
        <p className="text-pretty text-muted-foreground">
          {state?.nomineeName ? (
            <>
              Thank you for nominating{" "}
              <strong className="text-foreground">{state.nomineeName}</strong>
              {state.categoryName && (
                <>
                  {" "}
                  for the{" "}
                  <strong className="text-foreground">{state.categoryName}</strong>
                </>
              )}
              .
            </>
          ) : (
            "Thank you — your nomination has been received."
          )}{" "}
          The committee reviews every submission after nominations close.
        </p>
      </div>

      <div className="rise-in rise-in-delay-2 flex flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="rounded-full px-7">
          <Link to={`/e/${event.slug}`}>
            <Award className="size-4" /> Nominate someone else
          </Link>
        </Button>
      </div>
    </div>
  )
}
