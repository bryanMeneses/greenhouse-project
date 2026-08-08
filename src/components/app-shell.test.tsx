import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import { AppShell } from './app-shell'

describe('AppShell', () => {
  it('renders the primary navigation, the title, and its content', () => {
    render(
      <AppShell title="Dashboard">
        <p>Return list goes here</p>
      </AppShell>,
    )

    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Return list goes here')).toBeInTheDocument()
  })

  it('marks the active nav item as the current page', () => {
    render(
      <AppShell title="Review Queue" activeNav="Review Queue">
        <p>content</p>
      </AppShell>,
    )

    expect(screen.getByRole('link', { name: 'Review Queue' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AppShell title="Dashboard">
        <p>content</p>
      </AppShell>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
