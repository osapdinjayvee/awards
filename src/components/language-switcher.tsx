import { Languages } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLang } from "@/hooks/use-lang"
import { LANGS, LANG_LABELS, LANG_SHORT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/**
 * Interface language picker. `tone="light"` is for placement on the branded
 * hero, where the surface is the primary color rather than the page.
 */
export function LanguageSwitcher({
  tone = "default",
  className,
}: {
  tone?: "default" | "light"
  className?: string
}) {
  const { lang, setLang } = useLang()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          tone === "light"
            ? "border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            : "border-border/60 bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
          className,
        )}
        aria-label="Change language"
      >
        <Languages className="size-3.5" />
        {LANG_SHORT[lang]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() => setLang(l)}
            className={cn("text-sm", l === lang && "font-semibold text-primary")}
          >
            {LANG_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
