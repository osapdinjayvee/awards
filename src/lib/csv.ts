/** RFC-4180-ish CSV: quotes any field containing comma, quote, or newline. */
export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (v: string | number | null) => {
    const s = v == null ? "" : String(v)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n")
}

export function downloadCsv(filename: string, csv: string) {
  // BOM so Excel opens UTF-8 (ñ etc.) correctly
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
