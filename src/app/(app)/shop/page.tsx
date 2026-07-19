import { CurtainCatalogue } from '@/components/catalogue/CurtainCatalogue'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const metadata = {
  description:
    'Shop Alemah window curtains, door curtains, sheers and blackout curtains for Indian homes.',
  title: 'Curtains for every room',
}

export const dynamic = 'force-dynamic'

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  const hasPostgres = [process.env.DATABASE_URL, process.env.DATABASE_URI].some((url) =>
    url?.startsWith('postgres'),
  )

  if (process.env.NEXT_PHASE === 'phase-production-build' && !hasPostgres) {
    return <CurtainCatalogue initialSearch={params.search || ''} initialFilters={params} products={[]} />
  }

  const payload = await getPayload({ config: configPromise })
  const products = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: 'catalogue.salesRank',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { asin: { exists: true } },
      ],
    },
  })

  return <CurtainCatalogue initialSearch={params.search || ''} initialFilters={params} products={products.docs} />
}
