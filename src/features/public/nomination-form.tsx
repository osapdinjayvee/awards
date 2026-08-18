import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useOutletContext, useParams } from "react-router"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import {
  eventIsOpen,
  type AwardEvent,
  type CategoryWithCriteria,
} from "@/lib/types"
import { useRoster, useUnits } from "@/hooks/use-event"
import { AttachmentUploader } from "./attachment-uploader"
import { NomineeCombobox } from "./nominee-combobox"

type Ctx = { event: AwardEvent; categories: CategoryWithCriteria[] }

const schema = z.object({
  nominator_name: z.string().trim().min(2, "Please enter your name").max(200),
  nominator_email: z.string().trim().email("Please enter a valid email"),
  nominee_id: z.string().uuid({ message: "Please select a nominee" }),
  justification: z
    .string()
    .trim()
    .min(50, "Please write at least 50 characters so the committee can evaluate the nomination")
    .max(5000, "Justification must be 5000 characters or fewer"),
  website: z.string().max(0).optional(), // honeypot — must stay empty
})

type FormValues = z.infer<typeof schema>

export function NominationForm() {
  const { categoryId } = useParams()
  const { event, categories } = useOutletContext<Ctx>()
  const navigate = useNavigate()
  const category = categories.find((c) => c.id === categoryId)
  const isTeam = category?.type === "team"

  const { data: people = [] } = useRoster(isTeam ? undefined : event.id)
  const { data: units = [] } = useUnits(isTeam ? event.id : undefined)

  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nominator_name: "",
      nominator_email: "",
      nominee_id: "",
      justification: "",
      website: "",
    },
  })

  if (!category) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <p className="text-muted-foreground">This award category was not found.</p>
        <Button asChild variant="link">
          <Link to={`/e/${event.slug}`}>Back to {event.title}</Link>
        </Button>
      </div>
    )
  }

  if (!eventIsOpen(event)) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <p className="text-muted-foreground">
          Nominations for this event are closed.
        </p>
        <Button asChild variant="link">
          <Link to={`/e/${event.slug}`}>Back to {event.title}</Link>
        </Button>
      </div>
    )
  }

  async function onSubmit(values: FormValues) {
    if (values.website) {
      // honeypot tripped — pretend success, store nothing
      navigate(`/e/${event.slug}/thanks`, {
        state: { categoryName: category!.name, nomineeName: "" },
      })
      return
    }
    setSubmitting(true)
    try {
      const nominationId = crypto.randomUUID()
      const { error } = await supabase.from("nominations").insert({
        id: nominationId,
        event_id: event.id,
        category_id: category!.id,
        nominee_person_id: isTeam ? null : values.nominee_id,
        nominee_unit_id: isTeam ? values.nominee_id : null,
        nominator_name: values.nominator_name,
        nominator_email: values.nominator_email,
        justification: values.justification,
      })
      if (error) {
        if (error.code === "23505") {
          toast.error("You have already nominated them in this category.")
        } else if (error.message.includes("rate_limited")) {
          toast.error("Too many nominations in a short time. Please try again later.")
        } else if (error.code === "42501") {
          toast.error("Nominations for this event just closed.")
        } else {
          toast.error("Something went wrong submitting your nomination. Please try again.")
        }
        return
      }

      // Upload attachments; nomination already stands if some fail.
      let uploadFailures = 0
      for (const file of files) {
        const path = `${event.id}/${nominationId}/${crypto.randomUUID()}-${file.name}`
        const { error: upErr } = await supabase.storage
          .from("attachments")
          .upload(path, file, { contentType: file.type })
        if (upErr) {
          uploadFailures++
          continue
        }
        const { error: rowErr } = await supabase
          .from("nomination_attachments")
          .insert({
            nomination_id: nominationId,
            storage_path: path,
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
          })
        if (rowErr) uploadFailures++
      }
      if (uploadFailures > 0) {
        toast.warning(
          `Your nomination was submitted, but ${uploadFailures} attachment${uploadFailures > 1 ? "s" : ""} failed to upload.`,
        )
      }

      const nominee = isTeam
        ? units.find((u) => u.id === values.nominee_id)?.name
        : people.find((p) => p.id === values.nominee_id)?.full_name
      navigate(`/e/${event.slug}/thanks`, {
        state: { categoryName: category!.name, nomineeName: nominee ?? "" },
      })
    } finally {
      setSubmitting(false)
    }
  }

  const justification = form.watch("justification")
  const errors = form.formState.errors

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to={`/e/${event.slug}`}>
          <ArrowLeft className="size-4" />
          {event.title}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{category.name}</CardTitle>
            <Badge variant="outline">{isTeam ? "Team / Unit" : "Individual"}</Badge>
          </div>
          {category.description && (
            <CardDescription>{category.description}</CardDescription>
          )}
        </CardHeader>
        {category.criteria.length > 0 && (
          <CardContent>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              The committee evaluates against these criteria
            </p>
            <ul className="space-y-1 text-sm">
              {category.criteria.map((cr) => (
                <li key={cr.id} className="flex justify-between gap-3">
                  <span>{cr.name}</span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {Number(cr.weight)}%
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="nominator_name">Your name</Label>
            <Input
              id="nominator_name"
              autoComplete="name"
              {...form.register("nominator_name")}
            />
            {errors.nominator_name && (
              <p className="text-sm text-destructive">{errors.nominator_name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nominator_email">Your email</Label>
            <Input
              id="nominator_email"
              type="email"
              autoComplete="email"
              {...form.register("nominator_email")}
            />
            {errors.nominator_email && (
              <p className="text-sm text-destructive">{errors.nominator_email.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label>{isTeam ? "Unit or office to nominate" : "Person to nominate"}</Label>
          {isTeam ? (
            <NomineeCombobox
              mode="unit"
              units={units}
              value={form.watch("nominee_id") || null}
              onChange={(id) =>
                form.setValue("nominee_id", id, { shouldValidate: true })
              }
            />
          ) : (
            <NomineeCombobox
              mode="person"
              people={people}
              eligibleGroups={category.eligible_groups}
              value={form.watch("nominee_id") || null}
              onChange={(id) =>
                form.setValue("nominee_id", id, { shouldValidate: true })
              }
            />
          )}
          {errors.nominee_id && (
            <p className="text-sm text-destructive">{errors.nominee_id.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="justification">Justification</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {justification.length}/5000
            </span>
          </div>
          <Textarea
            id="justification"
            rows={8}
            placeholder="Explain how the nominee meets the criteria above. Be specific — concrete examples help the committee."
            {...form.register("justification")}
          />
          {errors.justification && (
            <p className="text-sm text-destructive">{errors.justification.message}</p>
          )}
        </div>

        <AttachmentUploader
          files={files}
          onChange={setFiles}
          onError={(m) => toast.error(m)}
        />

        {/* honeypot — hidden from humans, tempting to bots */}
        <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...form.register("website")}
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <Send className="size-4" /> Submit nomination
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
