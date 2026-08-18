import { useRef, useState } from "react"
import { toast } from "sonner"
import { ImageUp, Loader2, Trash2 } from "lucide-react"
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
import { supabase } from "@/lib/supabase"
import { brandingUrl, eventThemeStyle } from "@/lib/theme"
import type { AwardEvent } from "@/lib/types"
import { useUpdateEvent } from "@/hooks/use-admin"

const HEX = /^#[0-9a-fA-F]{6}$/

function ImageField({
  label,
  path,
  onUpload,
  onClear,
  uploading,
}: {
  label: string
  path: string | null
  onUpload: (file: File) => void
  onClear: () => void
  uploading: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const url = brandingUrl(path)
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {url ? (
          <img
            src={url}
            alt=""
            className="h-14 w-24 rounded-md border bg-muted object-contain"
          />
        ) : (
          <div className="flex h-14 w-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            None
          </div>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUpload(f)
            e.target.value = ""
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => ref.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImageUp className="size-4" />
          )}
          Upload
        </Button>
        {url && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="size-4" /> Remove
          </Button>
        )}
      </div>
    </div>
  )
}

export function BrandingEditor({ event }: { event: AwardEvent }) {
  const update = useUpdateEvent(event.id)
  const [primary, setPrimary] = useState(event.primary_color)
  const [accent, setAccent] = useState(event.accent_color)
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null)

  const validPrimary = HEX.test(primary) ? primary : event.primary_color
  const validAccent = HEX.test(accent) ? accent : event.accent_color

  async function uploadImage(kind: "logo" | "banner", file: File) {
    setUploading(kind)
    try {
      const ext = file.name.split(".").pop() || "png"
      const path = `${event.id}/${kind}-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from("branding")
        .upload(path, file, { contentType: file.type, upsert: true })
      if (error) throw error
      await update.mutateAsync(
        kind === "logo" ? { logo_path: path } : { banner_path: path },
      )
      toast.success(`${kind === "logo" ? "Logo" : "Banner"} updated.`)
    } catch {
      toast.error("Upload failed. Use an image under 5 MB.")
    } finally {
      setUploading(null)
    }
  }

  async function saveColors() {
    if (!HEX.test(primary) || !HEX.test(accent)) {
      toast.error("Colors must be 6-digit hex values like #1e3a8a.")
      return
    }
    try {
      await update.mutateAsync({ primary_color: primary, accent_color: accent })
      toast.success("Colors saved.")
    } catch {
      toast.error("Could not save colors.")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Colors</CardTitle>
            <CardDescription>
              Buttons, links, and the hero take these colors on the public page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ["Primary color", primary, setPrimary],
                ["Accent color", accent, setAccent],
              ] as const
            ).map(([label, value, setter]) => (
              <div key={label} className="grid gap-2">
                <Label>{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={HEX.test(value) ? value : "#000000"}
                    onChange={(e) => setter(e.target.value)}
                    className="size-9 cursor-pointer rounded-md border p-1"
                    aria-label={`${label} picker`}
                  />
                  <Input
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-32 font-mono"
                    placeholder="#1e3a8a"
                  />
                </div>
              </div>
            ))}
            <Button onClick={saveColors} disabled={update.isPending}>
              {update.isPending && <Loader2 className="size-4 animate-spin" />}
              Save colors
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Images</CardTitle>
            <CardDescription>
              Logo appears in the hero; the banner becomes the hero background.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageField
              label="Logo"
              path={event.logo_path}
              uploading={uploading === "logo"}
              onUpload={(f) => uploadImage("logo", f)}
              onClear={() => update.mutate({ logo_path: null })}
            />
            <ImageField
              label="Banner"
              path={event.banner_path}
              uploading={uploading === "banner"}
              onUpload={(f) => uploadImage("banner", f)}
              onClear={() => update.mutate({ banner_path: null })}
            />
          </CardContent>
        </Card>
      </div>

      {/* Live preview — scoped wrapper, no portals inside */}
      <div>
        <p className="mb-2 text-sm font-medium">Live preview</p>
        <div
          className="overflow-hidden rounded-xl border shadow-sm"
          style={eventThemeStyle(validPrimary, validAccent)}
        >
          <div className="bg-primary px-6 py-10 text-center text-primary-foreground">
            {event.logo_path && (
              <img
                src={brandingUrl(event.logo_path)!}
                alt=""
                className="mx-auto mb-3 size-14 rounded-full bg-white/90 object-contain p-1"
              />
            )}
            <p className="text-xl font-bold">{event.title}</p>
            <p className="mt-1 text-xs opacity-90">
              {event.welcome_text || "Welcome text appears here."}
            </p>
          </div>
          <div className="space-y-3 p-6">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Sample Award Category</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Criteria and description preview.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm">Nominate</Button>
                <Button size="sm" variant="secondary">
                  Secondary
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
