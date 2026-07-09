import { seg } from '@renderer/styles/theme'

export interface SegmentedOption<T extends string> {
  key: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (key: T) => void
  size?: 'sm' | 'md'
}

// The overlapping-border pill-row pattern used throughout the design spec
// for sort buttons, East/West toggles, stat category pickers, etc. Active
// segment gets the accent fill; inactive segments share a 1px border with a
// -1px margin so borders don't double up between buttons.
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md'
}: SegmentedControlProps<T>): React.JSX.Element {
  const padding = size === 'sm' ? '4px 12px' : '6px 16px'
  const fontSize = size === 'sm' ? 11 : 13

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {options.map((opt, i) => {
        const active = opt.key === value
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              padding,
              background: seg.bg(active),
              color: seg.fg(active),
              border: `1px solid ${seg.border(active)}`,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize,
              letterSpacing: 1,
              cursor: 'pointer',
              textTransform: 'uppercase',
              marginRight: i === options.length - 1 ? 0 : -1,
              position: 'relative',
              zIndex: seg.z(active)
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
