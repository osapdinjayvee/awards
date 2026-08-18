import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useOutletContext, useParams } from "react-router"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
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

const MIN_JUSTIFICATION = 50

const schema = z.object({
  nominator_name: z.string().trim().min(2, "Please enter your name").max(200),
  nominator_email: z.string().trim().email("Please enter a valid email"),
  nominee_id: z.string().uuid({ message: "Please select a nominee" }),
  justification: z
    .string()
    .trim()
    .min(
      MIN_JUSTIFICATION,
      `Please write at least ${MIN_JUSTIFICATION} characters so the committee can evaluate the nomination`,
    )
    .max(5000, "Justification must be 5000 characters or fewer"),
  website: z.string().max(0).optional(), // honeypot — must stay empty
})

type FormValues = z.infer<typeof schema>

function Step({
  number,
  title,
  hint,
  children,
}: {
  number: number
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="relative pl-12">
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground"
      >
        {number}
      </span>
      <h2 className="pt-1 font-heading text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

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
  const minReached = justification.trim().length >= MIN_JUSTIFICATION
  const errors = form.formState.errors

  return (
    <div className="min-h-svh bg-background">
      {/* Category context header */}
      <div className="border-b bg-secondary/60">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3">
            <Link to={`/e/${event.slug}`}>
              <ArrowLeft className="size-4" />
              All awards
            </Link>
          </Button>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {isTeam ? "Team / unit nomination" : "Individual nomination"}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {category.name}
          </h1>
          {category.criteria.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {category.criteria.map((cr) => (
                <span
                  key={cr.id}
                  className="rounded-full border bg-card px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {cr.name}{" "}
                  <span className="font-medium text-foreground">
                    {Number(cr.weight)}%
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-2xl space-y-10 px-6 py-10"
        noValidate
      >
        <Step
          number={1}
          title={isTeam ? "Which unit are you nominating?" : "Who are you nominating?"}
          hint={
            isTeam
              ? "Pick the department, office, or committee."
              : "Search by name — the list only shows people eligible for this award."
          }
        >
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
        </Step>

        <Step
          number={2}
          title="Why do they deserve it?"
          hint="Speak to the criteria above — specific moments and examples carry more weight than general praise."
        >
          <div className="grid gap-2">
            <Textarea
              id="justification"
              rows={8}
              aria-label="Justification"
              placeholder="Tell the committee what makes this nominee exceptional..."
              {...form.register("justification")}
            />
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  "flex items-center gap-1",
                  minReached ? "text-primary" : "text-muted-foreground",
                )}
              >
                {minReached && <CheckCircle2 className="size-3.5" />}
                {minReached
                  ? "Minimum reached"
                  : `At least ${MIN_JUSTIFICATION} characters`}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {justification.length}/5000
              </span>
            </div>
            {errors.justification && (
              <p className="text-sm text-destructive">
                {errors.justification.message}
              </p>
            )}
          </div>
          <AttachmentUploader
            files={files}
            onChange={setFiles}
            onError={(m) => toast.error(m)}
          />
        </Step>

        <Step
          number={3}
          title="About you"
          hint="So the committee can verify the nomination. Your details stay with the committee."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="nominator_name">Your name</Label>
              <Input
                id="nominator_name"
                autoComplete="name"
                {...form.register("nominator_name")}
              />
              {errors.nominator_name && (
                <p className="text-sm text-destructive">
                  {errors.nominator_name.message}
                </p>
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
                <p className="text-sm text-destructive">
                  {errors.nominator_email.message}
                </p>
              )}
            </div>
          </div>
        </Step>

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

        <div className="border-t pt-6">
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full rounded-full sm:w-auto sm:px-10"
          >
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
        </div>
      </form>
    </div>
  )
}
