import type { Order, Product, Variant } from '@/payload-types'
import type { Metadata } from 'next'

import { AddressItem } from '@/components/addresses/AddressItem'
import { OrderStatus } from '@/components/OrderStatus'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import configPromise from '@payload-config'
import { ChevronLeftIcon } from 'lucide-react'
import { getPayload } from 'payload'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; accessToken?: string }>
}

const getPrice = (resource: Product | Variant | null | undefined, currency: string) => {
  if (!resource) return undefined
  const value = (resource as unknown as Record<string, unknown>)[`priceIn${currency}`]
  return typeof value === 'number' ? value : undefined
}

export default async function OrderPage({ params, searchParams }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })
  const { id } = await params
  const { email = '', accessToken = '' } = await searchParams

  const { docs } = await payload.find({
    collection: 'orders',
    depth: 2,
    limit: 1,
    overrideAccess: !Boolean(user),
    user,
    where: {
      and: [
        { id: { equals: id } },
        ...(user
          ? [{ customer: { equals: user.id } }]
          : [{ accessToken: { equals: accessToken } }, { customerEmail: { equals: email } }]),
      ],
    },
  })

  const order = (docs[0] as Order | undefined) || null
  if (!order) notFound()
  const currency = order.currency || 'INR'

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-8">
        {user ? (
          <Button asChild variant="ghost">
            <Link href="/orders"><ChevronLeftIcon />All orders</Link>
          </Button>
        ) : <span />}
        <h1 className="rounded bg-primary/10 px-2 font-mono text-sm uppercase tracking-[0.07em]">
          Order #{order.orderNumber || order.id}
        </h1>
      </div>

      <div className="flex flex-col gap-10 rounded-lg border bg-card px-6 py-4">
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
          <div>
            <p className="mb-1 font-mono text-sm uppercase text-primary/50">Order date</p>
            <time className="text-lg" dateTime={order.createdAt}>
              {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
            </time>
          </div>
          <div>
            <p className="mb-1 font-mono text-sm uppercase text-primary/50">Total</p>
            {typeof order.amount === 'number' ? <Price amount={order.amount} currencyCode={currency} /> : null}
          </div>
          <div>
            <p className="mb-1 font-mono text-sm uppercase text-primary/50">Payment status</p>
            {order.status ? <OrderStatus status={order.status} /> : null}
          </div>
        </div>

        {order.items?.length ? (
          <div>
            <h2 className="mb-4 font-mono text-sm uppercase text-primary/50">Items</h2>
            <ul className="flex flex-col gap-5">
              {order.items.map((item) => {
                const product = typeof item.product === 'object' ? item.product : undefined
                const variant = typeof item.variant === 'object' ? item.variant : undefined
                const unitPrice = getPrice(variant, currency) ?? getPrice(product, currency)

                return (
                  <li className="flex items-start justify-between gap-4" key={item.id}>
                    <div>
                      <p className="font-medium text-lg">{product?.title || 'Product'}</p>
                      {variant?.title ? <p className="text-sm text-primary/50">{variant.title}</p> : null}
                      <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
                    </div>
                    {unitPrice !== undefined ? <Price amount={unitPrice * item.quantity} currencyCode={currency} /> : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        {order.shippingAddress ? (
          <div>
            <h2 className="mb-4 font-mono text-sm uppercase text-primary/50">Shipping address</h2>
            <AddressItem address={{ ...order.shippingAddress, country: order.shippingAddress.country || undefined }} hideActions />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    description: `Order details for order ${id}.`,
    openGraph: mergeOpenGraph({ title: `Order ${id}`, url: `/orders/${id}` }),
    title: `Order ${id}`,
  }
}
