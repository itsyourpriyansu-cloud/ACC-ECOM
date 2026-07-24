import { afterEach, describe, expect, it, vi } from 'vitest'

import { ensureFirstUserIsAdmin } from '@/collections/Users/hooks/ensureFirstUserIsAdmin'
import { getSafeInternalPath } from '@/lib/auth/safe-redirect'

describe('account security', () => {
  afterEach(() => {
    delete process.env.BOOTSTRAP_ADMIN_EMAIL
    vi.restoreAllMocks()
  })

  it.each([
    [null, '/account'],
    ['https://evil.test', '/account'],
    ['//evil.test/path', '/account'],
    ['/\\evil.test/path', '/account'],
    ['/checkout?step=address#top', '/checkout?step=address#top'],
  ])('normalizes redirect %s to %s', (input, expected) => {
    expect(getSafeInternalPath(input)).toBe(expected)
  })

  it('does not promote the first public registrant without an explicit bootstrap email', async () => {
    const find = vi.fn().mockResolvedValue({ totalDocs: 0 })
    const roles = await ensureFirstUserIsAdmin({
      operation: 'create',
      req: { payload: { find } },
      siblingData: { email: 'visitor@example.com' },
      value: ['customer'],
    } as never)

    expect(roles).toEqual(['customer'])
    expect(find).not.toHaveBeenCalled()
  })

  it('promotes only the configured bootstrap email when the database is empty', async () => {
    process.env.BOOTSTRAP_ADMIN_EMAIL = 'owner@example.com'
    const find = vi.fn().mockResolvedValue({ totalDocs: 0 })
    const roles = await ensureFirstUserIsAdmin({
      operation: 'create',
      req: { payload: { find } },
      siblingData: { email: 'OWNER@example.com' },
      value: ['customer'],
    } as never)

    expect(roles).toEqual(['customer', 'admin'])
    expect(find).toHaveBeenCalledOnce()
  })
})
