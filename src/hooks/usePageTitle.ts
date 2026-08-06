import { useEffect } from 'react'

/**
 * Sets the document title for the current page.
 *
 * @param title - The page title, e.g. "Bookings".
 * @param prefix - Optional prefix (defaults to "Admin"). The final title is
 *                 rendered as `${prefix} · ${title}`.
 */
export function usePageTitle(title: string, prefix = 'Admin'): void {
  useEffect(() => {
    const previous = document.title
    document.title = `${prefix} · ${title}`
    return () => {
      document.title = previous
    }
  }, [title, prefix])
}
