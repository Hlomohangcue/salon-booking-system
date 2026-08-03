import { Link } from 'react-router'

type Variant = 'primary' | 'outline' | 'white' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: Variant
  size?: Size
  className?: string
  children: React.ReactNode
  to?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: () => void
}

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-purple-700 text-white hover:bg-purple-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600',
  outline:
    'border-2 border-purple-700 text-purple-700 hover:bg-purple-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600',
  white:
    'border-2 border-white text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
  ghost: 'text-purple-700 hover:bg-purple-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600',
}

const SIZE: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  to,
  children,
  type = 'button',
  disabled,
  onClick,
}: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANT[variant],
    SIZE[size],
    className,
  ].join(' ')

  if (to !== undefined) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
