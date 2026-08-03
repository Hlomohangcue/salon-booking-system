interface SectionTitleProps {
  title: string
  subtitle?: string
  centered?: boolean
  light?: boolean
}

export default function SectionTitle({
  title,
  subtitle,
  centered = true,
  light = false,
}: SectionTitleProps) {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
      <h2
        className={[
          'font-display text-3xl sm:text-4xl font-semibold leading-tight mb-4',
          light ? 'text-white' : 'text-gray-900',
        ].join(' ')}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={[
            'text-lg leading-relaxed max-w-2xl',
            centered ? 'mx-auto' : '',
            light ? 'text-purple-200' : 'text-gray-500',
          ].join(' ')}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
