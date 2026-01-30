export function normalizeClickUpName(input: string): string {
  // Normalize unicode + strip diacritics, then normalize common punctuation differences.
  // This prevents false "missing" results for names like "Nūr" vs "Nur" or "–" vs "-".
  return input
    .normalize("NFKD")
    // Remove diacritics
    .replace(/\p{Diacritic}/gu, "")
    // Normalize dash variants to hyphen-minus
    .replace(/[–—−]/g, "-")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

