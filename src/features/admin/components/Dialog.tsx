import { useEffect, useRef, type ReactNode } from 'react'

interface DialogProps {
  /** Accessible dialog title — wires up aria-labelledby. */
  title: string
  /** Accessible description — wires up aria-describedby. */
  description?: string
  /** Whether the dialog is open. When false, renders nothing. */
  open: boolean
  /** Called when the user requests closing (Escape, overlay click, or close button). */
  onClose: () => void
  /** Dialog body content. */
  children: ReactNode
  /** Footer/action area rendered below the body. */
  footer?: ReactNode
}

/**
 * Accessible modal dialog used by the Services module (and any future admin
 * flows). Implements the essential dialog behaviour:
 *
 *  - Renders into a fixed overlay so it works on top of the admin layout.
 *  - Traps keyboard focus inside the dialog while open.
 *  - Restores focus to the previously focused element on close.
 *  - Closes on Escape and on overlay click (outside the panel).
 *  - Exposes a proper `role="dialog"`, `aria-modal`, `aria-labelledby`, and
 *    `aria-describedby`.
 */
export default function Dialog({
  title,
  description,
  open,
  onClose,
  children,
  footer,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useRef(`dialog-title-${Math.random().toString(36).slice(2)}`)
  const descId = useRef(`dialog-desc-${Math.random().toString(36).slice(2)}`)

  // Focus management + Escape handling while open.
  useEffect(() => {
    if (!open) return undefined

    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      // Focus trap: keep Tab/Shift+Tab within the dialog.
      const panel = panelRef.current
      if (!panel) return
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previous?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        // Close only when clicking the overlay itself, not the panel.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        aria-describedby={description ? descId.current : undefined}
        tabIndex={-1}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 outline-none"
      >
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 id={titleId.current} className="font-display text-lg font-semibold text-gray-900">
              {title}
            </h2>
            {description && (
              <p id={descId.current} className="text-sm text-gray-500 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>

        {footer && (
          <footer className="flex flex-wrap justify-end gap-3 px-5 py-4 border-t border-gray-100">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

