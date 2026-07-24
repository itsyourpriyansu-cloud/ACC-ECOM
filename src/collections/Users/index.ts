import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { adminOrSelf } from '@/access/adminOrSelf'
import { checkRole } from '@/access/utilities'

import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'
import {
  enforceSafeUserMutation,
  recordAccountBlock,
  recordPasswordLogin,
  rejectBlockedLogin,
  rejectBlockedSession,
} from './hooks/security'
import { oauthSessionStrategy } from '@/lib/auth/strategy'
import { getAppURL } from '@/lib/auth/config'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => checkRole(['admin'], user),
    create: adminOnly,
    delete: adminOnly,
    read: adminOrSelf,
    unlock: adminOnly,
    // Customer profile changes go through the schema-validated profile route.
    // Keeping generic document updates admin-only closes every mass-assignment
    // path, including fields added to this collection in the future.
    update: adminOnly,
  },
  admin: {
    group: 'Users',
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    cookies: {
      domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    forgotPassword: {
      expiration: 60 * 60 * 1000,
      generateEmailHTML: (args) => {
        const url = `${getAppURL()}/reset-password?token=${encodeURIComponent(args?.token || '')}`
        return `<p>Use the link below to reset your Alemah password. This link expires in one hour.</p><p><a href="${url}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`
      },
      generateEmailSubject: () => 'Reset your Alemah password',
    },
    lockTime: 15 * 60 * 1000,
    maxLoginAttempts: 5,
    removeTokenFromResponses: true,
    strategies: [oauthSessionStrategy],
    tokenExpiration: 60 * 60 * 24 * 7,
    useSessions: true,
    verify: {
      generateEmailHTML: ({ token }) => {
        const url = `${getAppURL()}/verify-email?token=${encodeURIComponent(token)}`
        return `<p>Confirm your email address to finish creating your Alemah account.</p><p><a href="${url}">Verify email</a></p><p>If you did not create this account, you can ignore this email.</p>`
      },
      generateEmailSubject: () => 'Verify your Alemah email address',
    },
  },
  hooks: {
    afterChange: [recordAccountBlock],
    afterLogin: [recordPasswordLogin],
    afterRead: [rejectBlockedSession],
    beforeChange: [enforceSafeUserMutation],
    beforeLogin: [rejectBlockedLogin],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'firstName',
      type: 'text',
      maxLength: 80,
    },
    {
      name: 'lastName',
      type: 'text',
      maxLength: 80,
    },
    {
      name: 'displayName',
      type: 'text',
      maxLength: 120,
    },
    {
      name: 'avatarURL',
      type: 'text',
      maxLength: 2048,
    },
    {
      name: 'phoneNumber',
      type: 'text',
      unique: true,
      admin: {
        description: 'Stored in international format and verified before phone sign-in is enabled.',
      },
    },
    {
      name: 'phoneVerifiedAt',
      type: 'date',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      admin: { readOnly: true },
    },
    {
      name: 'googleSubject',
      type: 'text',
      unique: true,
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      admin: { readOnly: true },
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: ['customer'],
      hasMany: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: [
        {
          label: 'admin',
          value: 'admin',
        },
        {
          label: 'customer',
          value: 'customer',
        },
        {
          label: 'support',
          value: 'support',
        },
      ],
      saveToJWT: true,
    },
    {
      name: 'accountStatus',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Blocked', value: 'blocked' },
        { label: 'Pending deletion', value: 'pendingDeletion' },
      ],
      required: true,
      saveToJWT: true,
    },
    {
      name: 'authMethods',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      hasMany: true,
      options: [
        { label: 'Password', value: 'password' },
        { label: 'Google', value: 'google' },
      ],
    },
    {
      name: 'hasLocalPassword',
      type: 'checkbox',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: false,
    },
    {
      name: 'emailVerifiedAt',
      type: 'date',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
    },
    {
      name: 'acceptedTermsAt',
      type: 'date',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
    },
    {
      name: 'lastLoginProvider',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      options: [
        { label: 'Password', value: 'password' },
        { label: 'Google', value: 'google' },
      ],
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'amount', 'currency', 'items'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id'],
      },
    },
    {
      name: 'wishlists',
      type: 'join',
      collection: 'wishlists' as never,
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['product', 'createdAt'],
      },
    },
  ],
  versions: false,
}
