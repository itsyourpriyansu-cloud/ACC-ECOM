'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'

import { useUIStore } from '@/store/useUIStore'

const getPrice = (resource: unknown, currencyCode: string) => {
  if (!resource || typeof resource !== 'object') return undefined

  const value = (resource as Record<string, unknown>)[`priceIn${currencyCode}`]
  return typeof value === 'number' ? value : undefined
}

export default function CartDrawer() {
  const isOpen = useUIStore((state) => state.cartOpen)
  const setOpen = useUIStore((state) => state.setCartOpen)
  const { cart, decrementItem, incrementItem, isLoading, removeItem } = useCart()
  const items = cart?.items || []
  const totalQuantity = items.reduce((total, item) => total + (item.quantity || 0), 0)
  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(amount / 100)
  const freeShippingThreshold = 99900
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - (cart?.subtotal || 0))

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#512125]/35"
      onClick={() => setOpen(false)}
    >
      <aside
        aria-label="Shopping bag"
        className="relative flex h-full w-full max-w-md flex-col border-l border-alemah-sand/40 bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-alemah-sand/30 p-5">
          <div className="flex items-center gap-2 text-alemah-espresso">
            <ShoppingBag className="h-5 w-5 text-alemah-red-600" />
            <h2 className="font-serif text-lg font-bold">Your Bag</h2>
            <span className="text-xs text-alemah-taupe">({totalQuantity} items)</span>
          </div>
          <button
            aria-label="Close shopping bag"
            className="rounded-full p-1 text-alemah-espresso hover:bg-alemah-sand/20"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {!items.length ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <ShoppingBag className="h-10 w-10 text-alemah-taupe" />
              <div>
                <h3 className="font-serif text-lg font-bold text-alemah-espresso">Your bag is empty</h3>
                <p className="mt-1 text-sm text-alemah-taupe">Add an item to begin checkout.</p>
              </div>
              <Link className="text-sm font-semibold text-alemah-red-600" href="/shop" onClick={() => setOpen(false)}>
                Continue shopping
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const product = typeof item.product === 'object' ? item.product : undefined
              const variant = typeof item.variant === 'object' ? item.variant : undefined
              const firstGalleryItem = product?.gallery?.[0]
              const galleryImage =
                firstGalleryItem && typeof firstGalleryItem.image === 'object'
                  ? firstGalleryItem.image
                  : undefined
              const image = galleryImage || (typeof product?.meta?.image === 'object' ? product.meta.image : undefined)
              const unitPrice = getPrice(variant, 'INR') ?? getPrice(product, 'INR')
              const inventory =
                typeof variant?.inventory === 'number'
                  ? variant.inventory
                  : typeof product?.inventory === 'number'
                    ? product.inventory
                    : undefined

              return (
                <article className="flex gap-4 rounded-2xl border border-alemah-sand/35 bg-alemah-cream/25 p-3.5" key={item.id}>
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-alemah-cream">
                    {image?.url ? (
                      <Image alt={image.alt || product?.title || ''} className="object-cover" fill sizes="80px" src={image.url} />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-alemah-espresso">{product?.title || 'Product'}</p>
                        {variant?.title ? <p className="mt-0.5 text-xs text-alemah-taupe">{variant.title}</p> : null}
                      </div>
                      <button
                        aria-label={`Remove ${product?.title || 'item'} from bag`}
                        className="rounded-full p-1 text-alemah-taupe hover:text-ios-red"
                        disabled={!item.id || isLoading}
                        onClick={() => item.id && removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div className="flex h-8 items-center rounded-lg border border-alemah-sand px-1">
                        <button
                          aria-label="Reduce quantity"
                          className="p-1"
                          disabled={!item.id || isLoading}
                          onClick={() => item.id && decrementItem(item.id)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 px-2 text-center text-xs font-semibold">{item.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          className="p-1"
                          disabled={!item.id || isLoading || (inventory !== undefined && item.quantity >= inventory)}
                          onClick={() => item.id && incrementItem(item.id)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {unitPrice !== undefined ? (
                        <span className="text-sm font-bold text-alemah-espresso">
                          {formatINR(unitPrice * (item.quantity || 0))}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>

        {items.length ? (
          <div className="border-t border-alemah-sand/30 bg-alemah-cream/15 p-5">
            <div className="mb-4 rounded-xl border border-alemah-sand/45 bg-[#fffdfa] px-3 py-2 text-xs text-alemah-taupe">
              {freeShippingRemaining > 0 ? <>Add <b className="text-alemah-espresso">{formatINR(freeShippingRemaining)}</b> more for complimentary delivery.</> : <b className="text-alemah-espresso">Complimentary delivery is included with this order.</b>}
            </div>
            <div className="mb-1 flex justify-between text-sm text-alemah-taupe">
              <span>Subtotal</span>
              <span className="font-semibold text-alemah-espresso">{formatINR(cart?.subtotal || 0)}</span>
            </div>
            <p className="mb-4 text-xs text-alemah-taupe">Shipping and taxes are calculated securely at checkout.</p>
            <Link
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-alemah-red-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-alemah-red-700"
              href="/checkout"
              onClick={() => setOpen(false)}
            >
              Checkout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
