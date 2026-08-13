/** Shared date helpers for gallery featured-until fields. */

/** Parses featuredUntil form value (YYYY-MM-DD) to Date or undefined. */
export function parseFeaturedUntil(value: string | undefined): Date | undefined {
  if (!value || value.trim() === '') return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return undefined
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  if (m < 1 || m > 12 || d < 1 || d > 31) return undefined
  return new Date(y, m - 1, d)
}

/** Formats Date to YYYY-MM-DD for form inputs. */
export function formatFeaturedUntilDate(date: Date | undefined): string {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
