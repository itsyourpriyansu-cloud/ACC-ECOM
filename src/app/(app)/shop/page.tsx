import { CurtainCatalogue } from '@/components/catalogue/CurtainCatalogue'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const metadata = {
  description:
    'Shop Alemah window curtains, door curtains, sheers and blackout curtains for Indian homes.',
  title: 'Curtains for every room',
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
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

  const params = await searchParams

  return <CurtainCatalogue initialSearch={params.search || ''} initialFilters={params} products={products.docs} />
}
