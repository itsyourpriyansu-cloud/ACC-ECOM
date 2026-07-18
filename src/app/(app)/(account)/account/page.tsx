import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { AccountForm } from '@/components/forms/AccountForm'
import { Order, Product } from '@/payload-types'
import { OrderItem } from '@/components/OrderItem'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { Heart, MapPin, PackageCheck } from 'lucide-react'

export default async function AccountPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null
  let wishlist: Product[] = []

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your account settings.')}`,
    )
  }

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 5,
      user,
      overrideAccess: false,
      pagination: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []

    const wishlistResult = (await payload.find({
      collection: 'wishlists' as never,
      depth: 1,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      user,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })) as unknown as { docs: Array<{ product?: Product | number | null }> }

    wishlist = wishlistResult.docs
      .map((entry) => entry.product)
      .filter((product): product is Product => typeof product === 'object' && product !== null)
  } catch (error) {
    // when deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // so swallow the error here and simply render the page with fallback data where necessary
    // in production you may want to redirect to a 404  page or at least log the error somewhere
    // console.error(error)
  }

  return (
    <>
      <section className="rounded-2xl border border-alemah-sand/60 bg-alemah-cream/30 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-alemah-red-600">Your Alemah</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-alemah-espresso">Welcome back.</h1>
        <p className="mt-2 max-w-xl text-sm text-alemah-taupe">Keep your address, saved curtains and orders together in one quiet place.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link className="flex min-h-24 flex-col justify-between rounded-xl border border-alemah-sand/55 bg-[#fffdfa] p-4 transition-colors hover:bg-alemah-cream/50" href="/orders"><PackageCheck className="h-5 w-5 text-alemah-red-600" /><span className="text-sm font-semibold text-alemah-espresso">Track orders</span></Link>
          <Link className="flex min-h-24 flex-col justify-between rounded-xl border border-alemah-sand/55 bg-[#fffdfa] p-4 transition-colors hover:bg-alemah-cream/50" href="/account/addresses"><MapPin className="h-5 w-5 text-alemah-red-600" /><span className="text-sm font-semibold text-alemah-espresso">Saved addresses</span></Link>
          <a className="flex min-h-24 flex-col justify-between rounded-xl border border-alemah-sand/55 bg-[#fffdfa] p-4 transition-colors hover:bg-alemah-cream/50" href="#wishlist"><Heart className="h-5 w-5 text-alemah-red-600" /><span className="text-sm font-semibold text-alemah-espresso">Saved curtains</span></a>
        </div>
      </section>

      <div className="rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-6 sm:p-8">
        <h2 className="mb-8 font-serif text-3xl text-alemah-espresso">Account settings</h2>
        <AccountForm />
      </div>

      <div className="rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-6 sm:p-8" id="wishlist">
        <h2 className="mb-4 font-serif text-3xl text-alemah-espresso">Saved curtains</h2>
        {wishlist.length === 0 ? (
          <p className="mb-6">Save curtains you love and they will appear here.</p>
        ) : (
          <ul className="mb-6 flex flex-col gap-3">
            {wishlist.map((product) => (
              <li key={product.id}>
                <Link className="underline" href={`/products/${product.slug}`}>
                  {product.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="outline">
          <Link href="/shop">Browse curtains</Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-6 sm:p-8">
        <h2 className="mb-4 font-serif text-3xl text-alemah-espresso">Recent orders</h2>

        <p className="mb-8 max-w-2xl text-sm leading-6 text-alemah-taupe">Your latest purchase updates appear here. Open an order any time to see its payment and delivery details.</p>

        {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
          <p className="mb-8">You have no orders.</p>
        )}

        {orders && orders.length > 0 && (
          <ul className="flex flex-col gap-6 mb-8">
            {orders?.map((order, index) => (
              <li key={order.id}>
                <OrderItem order={order} />
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="default">
          <Link href="/orders">View all orders</Link>
        </Button>
      </div>
    </>
  )
}

export const metadata: Metadata = {
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
