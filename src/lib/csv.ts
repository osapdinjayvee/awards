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

/**
 * Reads an uploaded CSV as text, falling back to Windows-1252 when the bytes
 * are not valid UTF-8. HR exports from Excel are routinely Latin-1, and
 * decoding those as UTF-8 turns Bolaños into Bola<?>os — which then fails the
 * name check at the voting gate.
 */
export async function readCsvFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const utf8 = new TextDecoder("utf-8").decode(buffer)
  if (!utf8.includes("\uFFFD")) return utf8
  return new TextDecoder("windows-1252").decode(buffer)
}
