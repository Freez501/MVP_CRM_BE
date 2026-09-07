// src/utils/formatting.ts

/**
 * Capitalize первой буквы, с поддержкой префикса (ПФ)
 */
export function capitalize(s: string): string {
  if (!s) return ""
  const trimmed = s.trim()
  if (/^\(?пф\)?/i.test(trimmed)) {
    const cleanName = trimmed.replace(/^(\(?пф\)?[:\s-]*)+/i, "").trim()
    if (!cleanName) return "(ПФ)"
    return `(ПФ) ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * Очистить ключ полуфабриката от префикса ПФ
 */
export function cleanPfKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/^(\(?пф\)?[:\s-]*)+/gi, "")
    .trim()
}
