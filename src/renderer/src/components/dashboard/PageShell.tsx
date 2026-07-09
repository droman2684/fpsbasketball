import type { CSSProperties, ReactNode } from 'react'

interface PageShellProps {
  maxWidth: number
  children: ReactNode
}

// Every dashboard page wraps its content in a centered, max-width column with
// the same padding and fade-in — this is that wrapper so pages only specify
// the one number that actually varies (maxWidth) per the design spec.
export default function PageShell({ maxWidth, children }: PageShellProps): React.JSX.Element {
  const style: CSSProperties = {
    maxWidth,
    margin: '0 auto',
    padding: '20px 24px'
  }
  return (
    <div style={style} className="pg">
      {children}
    </div>
  )
}
