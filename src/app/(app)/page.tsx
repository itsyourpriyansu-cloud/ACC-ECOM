import type { Metadata } from 'next'

import AlemahHome from '@/components/home/AlemahHome'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const metadata: Metadata = {
  title: 'AlemAh Cotton Curtains | Window, Door & Striped Curtains',
  description:
    'Shop AlemAh cotton curtains for windows and doors. Explore striped, solid, light-filtering and room-darkening styles in practical sizes and coordinated packs.',
  alternates: {
    canonical: '/',
  },
}

// Payload needs a live database, so never query it while Vercel prerenders the build.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })
  const products = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 24,
    pagination: false,
    sort: 'catalogue.salesRank',
    where: { and: [{ _status: { equals: 'published' } }, { asin: { exists: true } }] },
  })

  return <AlemahHome products={products.docs} />
}
