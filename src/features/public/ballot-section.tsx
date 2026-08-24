import { useMemo, useState } from "react"
import { Check, ChevronsUpDown, Lock } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useLang } from "@/hooks/use-lang"
import { matchesTokens, normalizeForSearch, searchTokens } from "@/lib/search"
import { cn } from "@/lib/utils"

export interface Candidate {
  id: string
  label: string
  sub: string | null
}

/**
 * One contested section of the ballot: a searchable picker while the voter is
 * still deciding, a locked receipt of their own choice once the vote is in.
 * Tallies stay admin-only — voters never see how a section is running.
 */
export function BallotSection({
  title,
  candidates,
  votedNomineeId,
  pickedId,
  onPick,
  disabled,
}: {
  title: string
  candidates: Candidate[]
  /** non-null = already submitted; show the receipt instead of the picker */
  votedNomineeId: string | null
  pickedId: string | null
  onPick: (candidateId: string | null) => void
  disabled: boolean
}) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const byId = useMemo(
    () => new Map(candidates.map((c) => [c.id, c])),
    [candidates],
  )

  // Name and position folded once per candidate, matched on every keystroke.
  const haystacks = useMemo(
    () =>
      new Map(
        candidates.map((c) => [c.id, normalizeForSearch(`${c.label} ${c.sub ?? ""}`)]),
      ),
    [candidates],
  )
  const matches = useMemo(() => {
    const tokens = searchTokens(search)
    if (tokens.length === 0) return candidates
    return candidates.filter((c) =>
      matchesTokens(haystacks.get(c.id) ?? "", tokens),
    )
  }, [candidates, haystacks, search])

  // ---------- Submitted: the voter's own receipt ----------
  if (votedNomineeId) {
    const mine = byId.get(votedNomineeId)

    return (
      <section className="space-y-2.5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            {title}
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
              <Check className="size-2.5" strokeWidth={3} />{" "}
              {t("section.submitted")}
            </span>
          </h3>
          <Lock
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        </div>

        <div className="rounded-2xl border border-primary/40 bg-primary/4 px-4 py-3.5 ring-1 ring-primary/15">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                <span className="truncate">
                  {mine?.label ?? t("section.lockedVote")}
                </span>
                <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {t("section.yourVote")}
                </span>
              </p>
              {mine?.sub && (
                <p className="truncate text-xs text-muted-foreground">
                  {mine.sub}
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("section.resultsHidden")}
        </p>
      </section>
    )
  }

  // ---------- Still open: picker ----------
  const picked = pickedId ? byId.get(pickedId) : null

  return (
    <section className="space-y-2.5 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {t("section.candidates", { n: candidates.length })}
        </span>
      </div>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setSearch("")
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled || candidates.length === 0}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 disabled:opacity-60",
              "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
              picked
                ? "border-primary/50 bg-primary/6 ring-1 ring-primary/15"
                : "border-border/70 bg-background/60 hover:border-primary/40 hover:bg-secondary/50",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                picked
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30",
              )}
            >
              {picked && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              {picked ? (
                <>
                  <span className="block truncate text-sm font-medium">
                    {picked.label}
                  </span>
                  {picked.sub && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {picked.sub}
                    </span>
                  )}
                </>
              ) : (
                <span className="block truncate text-sm text-muted-foreground">
                  {candidates.length === 0
                    ? t("section.empty")
                    : t("section.choose")}
                </span>
              )}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-(--radix-popover-trigger-width) overflow-hidden rounded-2xl p-0 shadow-lg"
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={t("section.searchPlaceholder")}
            />
            <CommandList>
              <CommandEmpty>{t("section.noMatch")}</CommandEmpty>
              <CommandGroup>
                {matches.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    className="rounded-xl py-2.5"
                    onSelect={() => {
                      onPick(pickedId === c.id ? null : c.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0 text-primary",
                        pickedId === c.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{c.label}</span>
                      {c.sub && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {c.sub}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {picked && (
        <button
          type="button"
          onClick={() => onPick(null)}
          disabled={disabled}
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {t("section.clear")}
        </button>
      )}
    </section>
  )
}
