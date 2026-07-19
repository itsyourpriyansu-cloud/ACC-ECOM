import type { Metadata } from 'next'

import AlemahHome from '@/components/home/AlemahHome'

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
  const hasPostgres = [process.env.DATABASE_URL, process.env.DATABASE_URI].some((url) =>
    url?.startsWith('postgres'),
  )
  const payloadUnavailable = process.env.VERCEL && (!hasPostgres || !process.env.PAYLOAD_SECRET)

  // Keep the public storefront available while a new Vercel project is still
  // waiting for its database or secret. Payload is imported only after this
  // check because its production configuration intentionally validates both.
  if (payloadUnavailable || (process.env.NEXT_PHASE === 'phase-production-build' && !hasPostgres)) {
    return <AlemahHome products={[]} />
  }

  const [{ default: configPromise }, { getPayload }] = await Promise.all([
    import('@payload-config'),
    import('payload'),
  ])
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
