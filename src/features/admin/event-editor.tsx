import { Link, useParams } from "react-router"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminEvent } from "@/hooks/use-admin"
import { EventDetailsForm } from "./event-details-form"
import { CategoriesEditor } from "./categories-editor"
import { RosterManager } from "./roster-manager"
import { BrandingEditor } from "./branding-editor"
import { NominationsViewer } from "./nominations-viewer"
import { VotersManager } from "./voters-manager"
import { ResultsViewer } from "./results-viewer"

export function EventEditor() {
  const { id } = useParams()
  const { data: event, isLoading } = useAdminEvent(id)

  if (isLoading || !event) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" aria-label="Back to events">
          <Link to="/admin">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">{event.title}</h1>
        <Badge variant="outline">{event.status}</Badge>
        {(event.status === "open" || event.status === "closed") && (
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <a href={`/e/${event.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" /> Public page
            </a>
          </Button>
        )}
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="voters">Voters</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="nominations">Nominations</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-4">
          <EventDetailsForm event={event} />
        </TabsContent>
        <TabsContent value="categories" className="pt-4">
          <CategoriesEditor eventId={event.id} />
        </TabsContent>
        <TabsContent value="roster" className="pt-4">
          <RosterManager eventId={event.id} />
        </TabsContent>
        <TabsContent value="voters" className="pt-4">
          <VotersManager eventId={event.id} />
        </TabsContent>
        <TabsContent value="branding" className="pt-4">
          <BrandingEditor event={event} />
        </TabsContent>
        <TabsContent value="results" className="pt-4">
          <ResultsViewer event={event} />
        </TabsContent>
        <TabsContent value="nominations" className="pt-4">
          <NominationsViewer event={event} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
