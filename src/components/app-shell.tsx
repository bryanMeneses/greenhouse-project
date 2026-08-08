import * as React from 'react'
import { LayoutDashboard, FileText, ListChecks, Sprout } from 'lucide-react'

import { cn } from '@/lib/utils'

type NavLabel = 'Dashboard' | 'Returns' | 'Review Queue'

type NavItem = {
  label: NavLabel
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '#dashboard', icon: LayoutDashboard },
  { label: 'Returns', href: '#returns', icon: FileText },
  { label: 'Review Queue', href: '#review-queue', icon: ListChecks },
]

type AppShellProps = {
  /** The nav item to mark as current. */
  activeNav?: NavLabel
  /** Heading shown in the content header. */
  title: string
  children: React.ReactNode
}

export function AppShell({ activeNav = 'Dashboard', title, children }: AppShellProps) {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar activeNav={activeNav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <UserBadge />
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

function Sidebar({ activeNav }: { activeNav: NavLabel }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sprout className="size-4" />
        </span>
        <span className="font-serif text-base font-semibold text-sidebar-foreground">
          Greenhouse Tax
        </span>
      </div>
      <nav aria-label="Primary" className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === activeNav
          const Icon = item.icon
          return (
            <a
              key={item.label}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </a>
          )
        })}
      </nav>
    </aside>
  )
}

function UserBadge() {
  return (
    <div className="flex items-center gap-2">
      <div className="text-right leading-tight">
        <div className="text-sm font-medium">Dana Reyes, CPA</div>
        <div className="text-xs text-muted-foreground">Preparer</div>
      </div>
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
      >
        DR
      </span>
    </div>
  )
}
