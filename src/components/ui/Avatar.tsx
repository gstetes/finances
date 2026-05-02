import { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
} as const

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src?: string
  name?: string
  size?: keyof typeof sizes
}

export function Avatar({ src, name, size = 'md', className, ...props }: AvatarProps) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={cn('rounded-full object-cover', sizes[size], className)}
        {...props}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700',
        sizes[size],
        className,
      )}
      aria-label={name ?? 'Avatar'}
    >
      {initials}
    </span>
  )
}
