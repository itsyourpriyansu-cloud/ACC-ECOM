import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  throw new Error('Demo seeding is disabled in production. Set ALLOW_DEMO_SEED=true only for an empty demo environment.')
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
const payload = await getPayload({ config: configPromise })

const { docs: categories } = await payload.find({
  collection: 'categories',
  limit: 1,
  overrideAccess: true,
  where: { slug: { equals: 'demo-home-textiles' } },
})

const category =
  categories[0] ||
  (await payload.create({
    collection: 'categories',
    data: { slug: 'demo-home-textiles', title: 'Demo Home Textiles' },
    overrideAccess: true,
  }))

const { docs: mediaFiles } = await payload.find({
  collection: 'media',
  limit: 1,
  overrideAccess: true,
  where: { filename: { equals: 'demo-cotton-bedsheet.png' } },
})

const media =
  mediaFiles[0] ||
  (await payload.create({
    collection: 'media',
    data: { alt: 'Demo premium cotton bedsheet' },
    file: {
      data: await readFile(path.resolve(dirname, '../endpoints/seed/tshirt-white.png')),
      mimetype: 'image/png',
      name: 'demo-cotton-bedsheet.png',
      size: 780560,
    },
    overrideAccess: true,
  }))

const { docs: products } = await payload.find({
  collection: 'products',
  limit: 1,
  overrideAccess: true,
  where: { slug: { equals: 'demo-cotton-bedsheet' } },
})

const product =
  products[0] ||
  (await payload.create({
    collection: 'products',
    data: {
      _status: 'published',
      categories: [category.id],
      enableVariants: false,
      gallery: [{ image: media.id }],
      inventory: 25,
      priceInINR: 2499,
      sku: 'DEMO-COTTON-BEDSHEET',
      slug: 'demo-cotton-bedsheet',
      title: 'Demo Premium Cotton Bedsheet',
    },
    overrideAccess: true,
  }))

console.info(`Demo catalogue is ready: product ${product.id}`)
await payload.destroy()
