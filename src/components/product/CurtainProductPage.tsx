import type { Product } from '@/payload-types'
import Link from 'next/link'
import { Check, ChevronLeft, Ruler, ShieldCheck, SunMedium, Truck } from 'lucide-react'

import { ProductDescription } from './ProductDescription'
import { CurtainSizeGuide } from './CurtainSizeGuide'
import './curtain-product-page.css'

const fallbackImage =
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=90'

export function CurtainProductPage({ product }: { product: Product }) {
  const attributes = product.catalogue?.attributes
  const visual = product.catalogue?.visual
  const facts = [
    ['Fabric', attributes?.fabric],
    ['Light & privacy', attributes?.opacity],
    ['Colour', attributes?.color],
    ['Best for', attributes?.recommendedRoom],
    ['Header', attributes?.closureType || attributes?.installation],
    ['Pack', attributes?.packOf ? `${attributes.packOf} panels` : undefined],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]))

  return (
    <div className="curtain-product-shell">
      <div className="curtain-product-breadcrumb"><Link href="/shop"><ChevronLeft size={16} /> All curtains</Link><span> / </span><span>{attributes?.curtainType || 'Curtains'}</span></div>
      <div className="curtain-product-main">
        <div className="curtain-product-image"><img src={visual?.stockImageUrl || fallbackImage} alt={visual?.alt || product.title} /><span>{attributes?.opacity || 'Thoughtfully made'}</span></div>
        <div className="curtain-product-buy">
          <p className="curtain-product-kicker">{attributes?.curtainType || 'Alemah curtains'} <b>·</b> {attributes?.color || 'Curated colour'}</p>
          <ProductDescription product={product} />
          <div className="curtain-product-assurances"><span><Truck size={16} /> Delivery updates from dispatch</span><span><ShieldCheck size={16} /> Clear support when you need it</span></div>
        </div>
      </div>
      <div className="curtain-product-details">
        <section><p className="curtain-product-label">At a glance</p><div className="curtain-product-facts">{facts.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
        <section className="curtain-product-measure"><Ruler size={25} /><div><strong>Measure for a fuller finish</strong><p>For a relaxed, premium fall, choose curtains that are 1.5–2× the width of your rod.</p><CurtainSizeGuide closureType={attributes?.closureType || attributes?.installation} packOf={attributes?.packOf} size={attributes?.size} /></div></section>
      </div>
      {product.highlights?.length ? <section className="curtain-product-highlights"><p className="curtain-product-label">Why you’ll love it</p><div>{product.highlights.map((highlight) => <span key={highlight.id}><Check size={16} />{highlight.text}</span>)}</div></section> : null}
      {product.faqs?.length ? <section className="curtain-product-faq"><p className="curtain-product-label">Product questions</p>{product.faqs.map((faq) => <details key={faq.id}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</section> : null}
      <section className="curtain-product-note"><SunMedium size={20} /><p>Stock visuals are used for this preview. Replace them with approved Alemah product photography before launch.</p></section>
    </div>
  )
}
