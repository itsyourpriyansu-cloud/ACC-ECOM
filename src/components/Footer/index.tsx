'use client'

import Link from 'next/link'
import { shopLink } from '@/components/storefront-config'

const columns = [
  { title: 'Shop', links: [['Window Curtains', shopLink({ type: 'window' })], ['Door Curtains', shopLink({ type: 'door' })], ['Striped Curtains', shopLink({ pattern: 'striped' })], ['Solid Curtains', shopLink({ pattern: 'solid' })], ['Best Sellers', shopLink({ sort: 'best' })], ['Value Packs', shopLink({ pack: '2' })]] },
  { title: 'Help', links: [['Size Guide', '/#size-guide'], ['Fabric Guide', '/#fabric-guide'], ['Installation Tips', '/faq'], ['Shipping & Returns', '/faq'], ['Track Order', '/find-order'], ['Contact', '/faq']] },
  { title: 'Company', links: [['About AlemAh', '/#why-alemah'], ['Curtain Inspiration', '/#signature-stripes'], ['Privacy Policy', '/privacy'], ['Terms & Conditions', '/terms']] },
] as const

export default function Footer() {
  return <footer className="border-t border-alemah-sand/40 bg-[#fffdfa] text-alemah-espresso">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:py-16">
      <div><Link href="/" className="font-serif text-2xl font-extrabold tracking-[.12em] text-alemah-red-600">ALEMAH</Link><p className="mt-4 max-w-[250px] text-sm leading-6 text-alemah-taupe">Thoughtful curtains for softness, light and everyday comfort at home.</p><p className="mt-5 text-xs font-bold text-alemah-taupe">India · INR</p></div>
      {columns.map((column) => <div key={column.title}><h2 className="text-xs font-extrabold uppercase tracking-[.12em]">{column.title}</h2><ul className="mt-4 grid gap-3">{column.links.map(([label, href]) => <li key={label}><Link className="text-sm text-alemah-taupe transition-colors hover:text-alemah-red-600" href={href}>{label}</Link></li>)}</ul></div>)}
    </div>
    <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-alemah-sand/40 px-5 py-5 text-xs text-alemah-taupe sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© {new Date().getFullYear()} AlemAh. All rights reserved.</span><span>Payment methods are shown securely at checkout when available.</span></div>
  </footer>
}
