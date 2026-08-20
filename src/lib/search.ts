/**
 * Name/position matching for pickers and admin lists.
 *
 * Roster records are stored surname-first ("Osapdin, Jayvee Mellendrez"), but
 * people search however they think of a colleague — first name, middle name,
 * position, or a natural "Jayvee Osapdin". So: fold accents, split the query
 * into tokens, and require every token to appear somewhere in the record, in
 * any order.
 */

/** Lowercase, strip diacritics, and turn punctuation into separators. */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** The query split into the terms that all have to match. */
export function searchTokens(query: string): string[] {
  const normalized = normalizeForSearch(query)
  return normalized ? normalized.split(" ") : []
}

/**
 * True when every token appears in the haystack. An empty query matches all.
 * Pass a pre-normalized haystack (see `normalizeForSearch`) when filtering a
 * list, so the folding cost is paid once per row instead of once per keystroke.
 */
export function matchesTokens(
  normalizedHaystack: string,
  tokens: string[],
): boolean {
  return tokens.every((token) => normalizedHaystack.includes(token))
}

/** One-shot convenience for small lists. */
export function matchesQuery(haystack: string, query: string): boolean {
  return matchesTokens(normalizeForSearch(haystack), searchTokens(query))
}
