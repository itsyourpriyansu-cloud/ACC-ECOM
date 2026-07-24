import type { FieldHook } from 'payload'

import type { User } from '@/payload-types'

// Bootstrap administration only for an explicitly configured email. Public
// registration must never turn the first visitor into an administrator.
export const ensureFirstUserIsAdmin: FieldHook<User> = async ({
  operation,
  req,
  siblingData,
  value,
}) => {
  if (operation === 'create') {
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase()
    const submittedEmail =
      typeof siblingData?.email === 'string' ? siblingData.email.trim().toLowerCase() : ''

    if (bootstrapEmail && submittedEmail === bootstrapEmail) {
      const users = await req.payload.find({
        collection: 'users',
        depth: 0,
        limit: 0,
        overrideAccess: true,
      })

      if (users.totalDocs !== 0) return value

      // if `admin` not in array of values, add it
      if (!(value || []).includes('admin')) {
        return [...(value || []), 'admin']
      }
    }
  }

  return value
}
