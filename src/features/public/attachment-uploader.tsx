import { useRef } from "react"
import { FileText, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export const MAX_FILES = 5
export const MAX_FILE_BYTES = 10 * 1024 * 1024 // mirrors bucket limit
export const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,.webp,.docx"

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentUploader({
  files,
  onChange,
  onError,
}: {
  files: File[]
  onChange: (files: File[]) => void
  onError: (message: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(list: FileList | null) {
    if (!list) return
    const next = [...files]
    for (const file of Array.from(list)) {
      if (next.length >= MAX_FILES) {
        onError(`You can attach up to ${MAX_FILES} files.`)
        break
      }
      if (file.size > MAX_FILE_BYTES) {
        onError(`"${file.name}" is over 10 MB.`)
        continue
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        onError(`"${file.name}" must be a PDF, image, or Word document.`)
        continue
      }
      if (next.some((f) => f.name === file.name && f.size === file.size)) continue
      next.push(file)
    }
    onChange(next)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={files.length >= MAX_FILES}
      >
        <Paperclip className="size-4" />
        Add supporting documents
      </Button>
      <p className="text-xs text-muted-foreground">
        Optional — up to {MAX_FILES} files, 10 MB each (PDF, images, Word).
      </p>
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}`}
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatSize(f.size)}
              </span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
