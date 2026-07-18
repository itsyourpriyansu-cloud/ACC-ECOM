import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import { OrderItem } from '@/components/OrderItem'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Orders() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null

  if (!user) {
    redirect(`/login?warning=${encodeURIComponent('Please login to access your orders.')}`)
  }

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 0,
      pagination: false,
      user,
      overrideAccess: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (error) {}

  return (
    <>
      <div className="w-full rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-alemah-red-600">Your purchases</p>
        <h1 className="mb-3 mt-2 font-serif text-4xl text-alemah-espresso">Orders & delivery</h1>
        <p className="mb-8 text-sm text-alemah-taupe">Open an order for its delivery address, payment status and tracking updates.</p>
        {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
          <div className="rounded-xl border border-dashed border-alemah-sand bg-alemah-cream/30 p-6"><p className="font-semibold text-alemah-espresso">No orders yet.</p><p className="mt-1 text-sm text-alemah-taupe">Your first Alemah curtain is waiting for its room.</p><Link className="mt-4 inline-flex text-sm font-semibold text-alemah-red-600 underline" href="/shop">Browse curtains</Link></div>
        )}

        {orders && orders.length > 0 && (
          <ul className="flex flex-col gap-6">
            {orders?.map((order, index) => (
              <li key={order.id}>
                <OrderItem order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export const metadata: Metadata = {
  description: 'Your orders.',
  openGraph: mergeOpenGraph({
    title: 'Orders',
    url: '/orders',
  }),
  title: 'Orders',
}
