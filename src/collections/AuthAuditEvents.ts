import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { checkRole } from '@/access/utilities'

export const AUTH_AUDIT_EVENTS = [
  'signup_succeeded',
  'signup_failed',
  'email_verification_succeeded',
  'email_verification_failed',
  'password_login_succeeded',
  'password_login_failed',
  'google_login_succeeded',
  'google_login_failed',
  'google_identity_linked',
  'logout',
  'logout_all_devices',
  'password_reset_requested',
  'password_reset_completed',
  'account_blocked',
  'identity_conflict',
  'oauth_state_mismatch',
  'oauth_callback_expired',
] as const

export const AuthAuditEvents: CollectionConfig = {
  slug: 'auth-audit-events',
  access: {
    admin: ({ req: { user } }) => checkRole(['admin'], user),
    create: () => false,
    delete: adminOnly,
    read: adminOnly,
    update: () => false,
  },
  admin: {
    group: 'Security',
    defaultColumns: ['event', 'success', 'provider', 'reasonCode', 'createdAt'],
    useAsTitle: 'event',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'event',
      type: 'select',
      options: AUTH_AUDIT_EVENTS.map((event) => ({ label: event, value: event })),
      required: true,
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
    },
    {
      name: 'provider',
      type: 'select',
      options: [
        { label: 'Password', value: 'password' },
        { label: 'Google', value: 'google' },
      ],
      index: true,
    },
    {
      name: 'success',
      type: 'checkbox',
      required: true,
      index: true,
    },
    {
      name: 'reasonCode',
      type: 'text',
      index: true,
    },
    {
      name: 'ipHash',
      type: 'text',
      index: true,
    },
    {
      name: 'userAgent',
      type: 'text',
      maxLength: 500,
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
  timestamps: true,
}
