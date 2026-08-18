import type { Criterion } from "@/lib/types"

/**
 * The evaluation split, at a glance: one segmented bar in tints of the
 * event's brand color, heaviest criterion first (data comes pre-sorted).
 */
const TINTS = [100, 72, 50, 32, 20, 12]

function tint(i: number): string {
  const pct = TINTS[Math.min(i, TINTS.length - 1)]
  return `color-mix(in oklab, var(--primary) ${pct}%, transparent)`
}

export function CriteriaBar({ criteria }: { criteria: Criterion[] }) {
  const total = criteria.reduce((s, c) => s + Number(c.weight), 0) || 100

  return (
    <div className="space-y-3">
      <div
        className="flex h-2 gap-px overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        {criteria.map((c, i) => (
          <div
            key={c.id}
            style={{
              width: `${(Number(c.weight) / total) * 100}%`,
              backgroundColor: tint(i),
            }}
          />
        ))}
      </div>
      <ul className="space-y-1.5">
        {criteria.map((c, i) => (
          <li key={c.id} className="flex items-baseline gap-2 text-sm">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 translate-y-px rounded-full"
              style={{ backgroundColor: tint(i) }}
            />
            <span className="min-w-0 flex-1">{c.name}</span>
            <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
              {Number(c.weight)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
