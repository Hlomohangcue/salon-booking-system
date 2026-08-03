interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: boolean
}

export default function Card({ children, className = '', hover = false, padding = true }: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-2xl border border-gray-100 shadow-sm',
        hover ? 'hover:shadow-md hover:-translate-y-1 transition-all duration-200' : '',
        padding ? 'p-6' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
