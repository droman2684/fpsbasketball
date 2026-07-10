import type { ReactNode } from 'react'
import NavBar from './NavBar'
import ContextBar from './ContextBar'
import SimBar from './SimBar'

// Composes the persistent dashboard chrome — top nav, context strip, and the
// fixed bottom sim bar — around whatever page content is passed as children.
// This is the single integration point other pages should import.
export default function DashboardShell({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F3', paddingBottom: 56 }}>
      <NavBar />
      <ContextBar />
      <main style={{ paddingBottom: 56 }}>{children}</main>
      <SimBar />
    </div>
  )
}
