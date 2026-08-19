import { Link, Navigate } from "react-router"
import { Award } from "lucide-react"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOpenEvents } from "@/hooks/use-event"
import { useLang } from "@/hooks/use-lang"
import { LanguageSwitcher } from "@/components/language-switcher"

export function EventsIndex() {
  const { data: events, isLoading } = useOpenEvents()
  const { t } = useLang()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (events && events.length === 1) {
    return <Navigate to={`/e/${events[0].slug}`} replace />
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 p-8">
      <div className="flex items-center gap-3">
        <Award className="size-8 text-primary" />
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("index.title")}
        </h1>
        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </div>
      {!events || events.length === 0 ? (
        <p className="text-muted-foreground">{t("index.empty")}</p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Link key={e.id} to={`/e/${e.slug}`} className="block">
              <Card className="transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle>{e.title}</CardTitle>
                  {e.description && (
                    <CardDescription className="line-clamp-2">
                      {e.description}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
