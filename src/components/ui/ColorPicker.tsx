import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
  '#14b8a6', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#64748b', '#78716c', '#0284c7',
] as const

export interface ColorPickerProps {
  label?: string
  value?: string
  onChange?: (color: string) => void
  error?: string
}

export function ColorPicker({ label, value, onChange, error }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange?.(color)}
            className={cn(
              'h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
              value === color && 'ring-2 ring-offset-2 ring-gray-900',
            )}
            style={{ backgroundColor: color }}
            aria-label={color}
            aria-pressed={value === color}
          />
        ))}
        <input
          type="color"
          value={value ?? '#6366f1'}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-full border-0 p-0"
          title="Cor personalizada"
        />
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
