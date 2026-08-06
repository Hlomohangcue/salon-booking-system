import type { ReactNode } from 'react'

/**
 * A column definition for the generic DataTable.
 * Renders a header cell and a value cell for each row.
 */
export interface DataTableColumn<T> {
  /** Column header label. */
  key: string
  /** Header text. */
  header: string
  /** Optional header alignment (defaults to left). */
  align?: 'left' | 'right' | 'center'
  /** Renders the cell content for a given row. */
  cell: (row: T) => ReactNode
  /** Optional class applied to the cell. */
  className?: string
}

interface DataTableProps<T> {
  /** Column definitions. */
  columns: DataTableColumn<T>[]
  /** Row data. */
  rows: T[]
  /** Unique key accessor for each row. */
  rowKey: (row: T) => string
  /** Optional empty state — an EmptyState component. */
  empty?: ReactNode
}

const ALIGN_CLASS: Record<NonNullable<DataTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

/**
 * A lightweight, reusable data table.
 *
 * Renders a responsive table with a header row and body rows. Column cells are
 * fully customisable via the `cell` renderer, making it suitable for Bookings,
 * Services, Customers, Reports, and any future admin module.
 *
 * On small screens the table scrolls horizontally to preserve the column layout.
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <>{empty}</>
  }

  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={[
                  'py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-gray-400',
                  ALIGN_CLASS[col.align ?? 'left'],
                ].join(' ')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-gray-50/60 transition-colors">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[
                    'py-3.5 pr-4 text-gray-700',
                    ALIGN_CLASS[col.align ?? 'left'],
                    col.className ?? '',
                  ].join(' ')}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
