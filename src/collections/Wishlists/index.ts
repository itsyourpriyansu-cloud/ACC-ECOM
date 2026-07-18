import type { CollectionConfig } from 'payload'

import { isDocumentOwner } from '@/access/isDocumentOwner'
import { checkRole } from '@/access/utilities'

export const Wishlists: CollectionConfig = {
  slug: 'wishlists',
  access: {
    create: ({ req: { user } }) => Boolean(user),
    delete: isDocumentOwner,
    read: isDocumentOwner,
    update: isDocumentOwner,
  },
  admin: {
    defaultColumns: ['customer', 'product', 'createdAt'],
    group: 'Customers',
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && !checkRole(['admin'], req.user)) {
          if (!req.user) throw new Error('Sign in to save a product.')
          data.customer = req.user.id
        }

        return data
      },
    ],
  },
}
