'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import type { Product } from '@/payload-types'
import { AddToCart } from '@/components/Cart/AddToCart'

const fallbackImage = 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85'
const price = (value?: number | null) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((value || 0) / 100)

export default function ProductCard({ product }: { product: Product }) {
  const attributes = product.catalogue?.attributes
  const image = product.catalogue?.visual?.stockImageUrl || fallbackImage
  const isBestSeller = Boolean(product.catalogue?.salesRank && product.catalogue.salesRank <= 8)

  return <article className="alemah-product-card">
    <Link href={`/products/${product.slug}`} className="alemah-product-card__image">
      <Image
        alt={product.catalogue?.visual?.alt || product.title}
        height={600}
        sizes="(max-width: 768px) 100vw, 33vw"
        src={image}
        width={900}
      />
      {isBestSeller ? <span>Best seller</span> : null}
    </Link>
    <div className="alemah-product-card__body">
      <p>{[attributes?.curtainType, attributes?.color].filter(Boolean).join(' · ') || 'Curtain'}</p>
      <Link href={`/products/${product.slug}`}><h3>{product.title}</h3></Link>
      <small>{[attributes?.size, attributes?.packOf ? `Pack of ${attributes.packOf}` : null].filter(Boolean).join(' · ') || 'Ready to hang'}</small>
      <div className="alemah-product-card__buy"><strong>{price(product.priceInINR)}</strong>{product.enableVariants ? <Link href={`/products/${product.slug}`}>Choose size</Link> : <Suspense fallback={<Link href={`/products/${product.slug}`}>View options</Link>}><AddToCart product={product} /></Suspense>}</div>
    </div>
  </article>
}
