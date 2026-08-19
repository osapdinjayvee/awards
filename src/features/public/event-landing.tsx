import { Link, useOutletContext } from "react-router"
import { ArrowDown, CalendarDays, Users, User, Vote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { brandingUrl, eventLogo } from "@/lib/theme"
import {
  EMPLOYMENT_GROUP_LABELS,
  eventIsOpen,
  type AwardEvent,
  type CategoryWithCriteria,
} from "@/lib/types"
import { CriteriaBar } from "./criteria-bar"

type Ctx = { event: AwardEvent; categories: CategoryWithCriteria[] }

function daysLeft(closesAt: string | null): number | null {
  if (!closesAt) return null
  const ms = new Date(closesAt).getTime() - Date.now()
  return ms > 0 ? Math.ceil(ms / 86_400_000) : null
}

/** Concentric medal-seal ornament for the hero. Purely decorative. */
function MedalSeal({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="200" cy="200" r="196" strokeWidth="1" opacity="0.35" />
      <circle
        cx="200"
        cy="200"
        r="168"
        strokeWidth="1.5"
        strokeDasharray="2 7"
        opacity="0.5"
      />
      <circle cx="200" cy="200" r="136" strokeWidth="1" opacity="0.4" />
      <circle
        cx="200"
        cy="200"
        r="104"
        strokeWidth="22"
        strokeDasharray="1 5"
        opacity="0.25"
      />
      <circle cx="200" cy="200" r="64" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

export function EventLanding() {
  const { event, categories } = useOutletContext<Ctx>()
  const open = eventIsOpen(event)
  const logo = eventLogo(event)
  const banner = brandingUrl(event.banner_path)
  const remaining = daysLeft(event.closes_at)

  return (
    <div className="min-h-svh bg-background pb-20">
      {/* ---- Hero ---- */}
      <header
        className="relative isolate overflow-hidden text-primary-foreground"
        style={{
          background: banner
            ? `linear-gradient(color-mix(in oklab, var(--primary) 82%, transparent), color-mix(in oklab, var(--primary) 94%, black)), url(${banner}) center / cover`
            : `linear-gradient(160deg, color-mix(in oklab, var(--primary) 92%, white) 0%, var(--primary) 55%, color-mix(in oklab, var(--primary) 80%, black) 100%)`,
        }}
      >
        <MedalSeal className="pointer-events-none absolute -right-24 -top-24 size-[26rem] text-white/20 sm:-right-12" />
        <MedalSeal className="pointer-events-none absolute -bottom-40 -left-32 size-[22rem] text-white/10" />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 pb-20 pt-16 text-center sm:pb-24 sm:pt-20">
          <img
            src={logo}
            alt=""
            className="rise-in size-24 rounded-full bg-white/95 object-contain p-2 shadow-xl ring-1 ring-white/40"
          />

          <div className="rise-in flex flex-wrap items-center justify-center gap-2 text-xs font-medium tracking-wide">
            <span
              className={
                "rounded-full border border-white/25 bg-white/10 px-3 py-1 backdrop-blur-sm" +
                (open ? "" : " opacity-80")
              }
            >
              {open ? "Voting open" : "Voting closed"}
            </span>
            {open && remaining !== null && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 backdrop-blur-sm">
                <CalendarDays className="size-3.5" />
                {remaining === 1 ? "Closes today" : `${remaining} days left`}
              </span>
            )}
          </div>

          <h1 className="rise-in rise-in-delay-1 text-balance font-heading text-4xl font-semibold tracking-tight sm:text-6xl">
            {event.title}
          </h1>

          {event.welcome_text && (
            <p className="rise-in rise-in-delay-2 max-w-xl text-pretty text-sm/relaxed text-white/85 sm:text-base/relaxed">
              {event.welcome_text}
            </p>
          )}

          {open && (
            <div className="rise-in rise-in-delay-3 mt-2 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-full bg-white px-8 text-primary shadow-md hover:bg-white/90"
              >
                <Link to="vote">
                  <Vote className="size-4" /> Start voting
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="rounded-full text-white hover:bg-white/10 hover:text-white"
              >
                <a href="#awards">
                  See the awards <ArrowDown className="size-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        {/* ---- About ---- */}
        {event.description && (
          <section className="mx-auto max-w-2xl py-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              About this recognition
            </p>
            <p className="text-pretty text-sm/relaxed text-muted-foreground sm:text-base/relaxed">
              {event.description}
            </p>
          </section>
        )}

        {/* ---- Categories ---- */}
        <section id="awards" className="scroll-mt-8 pb-4 pt-2">
          <div className="mb-8 text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              The Awards
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {categories.length} categories · each is voted per employment
              group · the bar shows how its criteria are weighed
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {categories.map((cat) => (
              <article
                key={cat.id}
                className="group flex flex-col rounded-2xl border bg-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-secondary-foreground">
                    {cat.type === "team" ? (
                      <>
                        <Users className="size-3" /> Team / Unit
                      </>
                    ) : (
                      <>
                        <User className="size-3" /> Individual
                      </>
                    )}
                  </span>
                  {cat.type === "individual" &&
                    cat.eligible_groups &&
                    cat.eligible_groups.length > 0 && (
                      <span className="text-muted-foreground">
                        {cat.eligible_groups
                          .map((g) => EMPLOYMENT_GROUP_LABELS[g])
                          .join(" · ")}
                      </span>
                    )}
                </div>

                <h3 className="font-heading text-xl font-semibold tracking-tight">
                  {cat.name}
                </h3>

                {cat.description && (
                  <p className="mt-2 line-clamp-3 text-sm/relaxed text-muted-foreground">
                    {cat.description}
                  </p>
                )}

                {cat.criteria.length > 0 && (
                  <div className="mt-5">
                    <CriteriaBar criteria={cat.criteria} />
                  </div>
                )}


              </article>
            ))}
          </div>

          {open && (
            <div className="mt-10 text-center">
              <Button asChild size="lg" className="rounded-full px-10">
                <Link to="vote">
                  <Vote className="size-4" /> Start voting
                </Link>
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
