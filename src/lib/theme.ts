import type { CSSProperties } from "react"
import type { AwardEvent } from "@/lib/types"
import { supabase } from "@/lib/supabase"

/** Relative luminance of a #rrggbb hex (0 = black, 1 = white). */
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return 0
  const int = parseInt(m[1], 16)
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return (
    0.2126 * channel((int >> 16) & 255) +
    0.7152 * channel((int >> 8) & 255) +
    0.0722 * channel(int & 255)
  )
}

/** White or near-black, whichever contrasts better against the given color. */
export function contrastForeground(hex: string): string {
  return luminance(hex) > 0.42 ? "oklch(0.145 0 0)" : "#ffffff"
}

const VAR_MAP = (primary: string, accent: string): Record<string, string> => ({
  "--primary": primary,
  "--primary-foreground": contrastForeground(primary),
  "--ring": primary,
  "--accent": `color-mix(in oklab, ${primary} 10%, white)`,
  "--accent-foreground": `color-mix(in oklab, ${primary} 80%, black)`,
  "--secondary": `color-mix(in oklab, ${primary} 6%, white)`,
  "--secondary-foreground": `color-mix(in oklab, ${primary} 75%, black)`,
  "--chart-1": primary,
  "--chart-2": accent,
})

/**
 * Applies event brand colors onto the shadcn CSS variables at the document root
 * (portalled dialogs/popovers escape wrapper divs, so root it is).
 * Returns a cleanup that restores the stylesheet defaults.
 */
export function applyEventTheme(primary: string, accent: string): () => void {
  const root = document.documentElement
  const vars = VAR_MAP(primary, accent)
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
  return () => {
    for (const k of Object.keys(vars)) root.style.removeProperty(k)
  }
}

/** Style object version, for scoped previews (branding editor). */
export function eventThemeStyle(
  primary: string,
  accent: string,
): CSSProperties {
  return VAR_MAP(primary, accent) as CSSProperties
}

export function brandingUrl(path: string | null): string | null {
  if (!path) return null
  return supabase.storage.from("branding").getPublicUrl(path).data.publicUrl
}

export function eventTheme(e: AwardEvent) {
  return { primary: e.primary_color, accent: e.accent_color }
}
