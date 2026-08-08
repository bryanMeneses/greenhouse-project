import { describe, it, expect } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b')
  })

  it('lets later tailwind classes win over earlier conflicting ones', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})
