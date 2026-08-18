import { useEffect } from "react"
import { Outlet, useParams } from "react-router"
import { useEventBySlug } from "@/hooks/use-event"
import { applyEventTheme } from "@/lib/theme"
import { Skeleton } from "@/components/ui/skeleton"

export function EventLayout() {
  const { eventSlug } = useParams()
  const { data, isLoading, isError } = useEventBySlug(eventSlug)
  const event = data?.event

  useEffect(() => {
    if (!event) return
    return applyEventTheme(event.primary_color, event.accent_color)
  }, [event])

  useEffect(() => {
    if (event) document.title = event.title
  }, [event])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground">
          We couldn't load this event. Please try again in a moment.
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">
          This award event doesn't exist or isn't published.
        </p>
      </div>
    )
  }

  return <Outlet context={data} />
}
