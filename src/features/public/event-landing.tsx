import { Link, useOutletContext } from "react-router"
import { CalendarDays, Users, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { brandingUrl } from "@/lib/theme"
import {
  EMPLOYMENT_GROUP_LABELS,
  eventIsOpen,
  type AwardEvent,
  type CategoryWithCriteria,
} from "@/lib/types"

type Ctx = { event: AwardEvent; categories: CategoryWithCriteria[] }

function daysLeft(closesAt: string | null): number | null {
  if (!closesAt) return null
  const ms = new Date(closesAt).getTime() - Date.now()
  return ms > 0 ? Math.ceil(ms / 86_400_000) : null
}

export function EventLanding() {
  const { event, categories } = useOutletContext<Ctx>()
  const open = eventIsOpen(event)
  const logo = brandingUrl(event.logo_path)
  const banner = brandingUrl(event.banner_path)
  const remaining = daysLeft(event.closes_at)

  return (
    <div className="min-h-svh bg-background pb-16">
      {/* Hero */}
      <header
        className="relative border-b bg-primary text-primary-foreground"
        style={
          banner
            ? {
                backgroundImage: `linear-gradient(color-mix(in oklab, var(--primary) 75%, transparent), color-mix(in oklab, var(--primary) 92%, black)), url(${banner})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-16 text-center">
          {logo && (
            <img
              src={logo}
              alt=""
              className="size-20 rounded-full bg-white/90 object-contain p-1 shadow-md"
            />
          )}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {event.title}
          </h1>
          {event.welcome_text && (
            <p className="max-w-2xl text-sm/relaxed opacity-90">
              {event.welcome_text}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {open ? (
              <>
                <Badge variant="secondary">Nominations open</Badge>
                {remaining !== null && (
                  <span className="flex items-center gap-1 opacity-90">
                    <CalendarDays className="size-4" />
                    {remaining === 1
                      ? "Closes today"
                      : `${remaining} days left to nominate`}
                  </span>
                )}
              </>
            ) : (
              <Badge variant="secondary">Nominations closed</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6">
        {event.description && (
          <section className="py-10">
            <h2 className="mb-3 text-lg font-semibold">About</h2>
            <p className="text-sm/relaxed text-muted-foreground">
              {event.description}
            </p>
          </section>
        )}

        <Separator />

        <section className="py-10">
          <h2 className="mb-6 text-lg font-semibold">Award Categories</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {categories.map((cat) => (
              <Card key={cat.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{cat.name}</CardTitle>
                    <Badge variant="outline" className="shrink-0 gap-1">
                      {cat.type === "team" ? (
                        <>
                          <Users className="size-3" /> Team / Unit
                        </>
                      ) : (
                        <>
                          <User className="size-3" /> Individual
                        </>
                      )}
                    </Badge>
                  </div>
                  {cat.description && (
                    <CardDescription className="line-clamp-4">
                      {cat.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {cat.criteria.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Criteria
                      </p>
                      <ul className="space-y-1.5">
                        {cat.criteria.map((cr) => (
                          <li
                            key={cr.id}
                            className="flex items-baseline justify-between gap-3 text-sm"
                          >
                            <span>{cr.name}</span>
                            <span className="shrink-0 font-medium tabular-nums text-accent-foreground">
                              {Number(cr.weight)}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cat.type === "individual" &&
                    cat.eligible_groups &&
                    cat.eligible_groups.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Open to:{" "}
                        {cat.eligible_groups
                          .map((g) => EMPLOYMENT_GROUP_LABELS[g])
                          .join(", ")}
                      </p>
                    )}
                </CardContent>
                {open && (
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to={`nominate/${cat.id}`}>Nominate</Link>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
