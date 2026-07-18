'use client'

import type { Product } from '@/payload-types'
import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { ArrowUpRight, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'

import './curtain-catalogue.css'

type FilterKey = 'room' | 'opacity' | 'fabric'

type CatalogueFilters = Record<string, string | undefined>

const fallbackImages = [
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=88',
  'https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1200&q=88',
  'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=88',
]

const valueFor = (product: Product, key: FilterKey) => {
  const attributes = product.catalogue?.attributes
  if (key === 'room') return attributes?.recommendedRoom || ''
  if (key === 'opacity') return attributes?.opacity || ''
  return attributes?.fabric || ''
}

const imageFor = (product: Product, index: number) =>
  product.catalogue?.visual?.stockImageUrl || fallbackImages[index % fallbackImages.length]

const formatINR = (amount?: number | null) =>
  new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(
    (amount || 0) / 100,
  )

export function CurtainCatalogue({ initialSearch = '', initialFilters = {}, products }: { initialSearch?: string; initialFilters?: CatalogueFilters; products: Product[] }) {
  const [search, setSearch] = useState(initialSearch)
  const [searchFocused, setSearchFocused] = useState(false)
  const [filter, setFilter] = useState<Record<FilterKey, string>>({ room: '', opacity: '', fabric: '' })
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const filters = useMemo(
    () =>
      (['room', 'opacity', 'fabric'] as FilterKey[]).map((key) => ({
        key,
        label: key === 'room' ? 'Room' : key === 'opacity' ? 'Light & privacy' : 'Fabric',
        options: Array.from(new Set(products.map((product) => valueFor(product, key)).filter(Boolean))).sort(),
      })),
    [products],
  )

  const filteredProducts = products.filter((product) => {
    const attributes = product.catalogue?.attributes
    const searchable = [product.title, attributes?.color, attributes?.size, attributes?.curtainType, attributes?.pattern, attributes?.opacity].filter(Boolean).join(' ').toLowerCase()
    const matchesSearch = searchable.includes(search.toLowerCase())
    const matchesFilters = (Object.keys(filter) as FilterKey[]).every(
      (key) => !filter[key] || valueFor(product, key) === filter[key],
    )
    const normalise = (value: string) => value
      .toLowerCase()
      .replace(/feet|foot/g, 'ft')
      .replace(/[^a-z0-9.]+/g, ' ')
      .trim()
    const contains = (value: string | null | undefined, query: string | undefined) =>
      !query || normalise(value || '').includes(normalise(query.replace('9 ft+', '9 ft')))
    const matchesLinks = contains(attributes?.curtainType, initialFilters.type)
      && contains(attributes?.pattern, initialFilters.pattern)
      && contains(attributes?.opacity, initialFilters.light)
      && contains(attributes?.color, initialFilters.color)
      && contains(attributes?.size, initialFilters.size)
      && (!initialFilters.pack || (attributes?.packOf || 0) >= Number(initialFilters.pack))
    return matchesSearch && matchesFilters && matchesLinks
  })

  const suggestions = search.trim().length > 1
    ? products.filter((product) => [product.title, product.catalogue?.attributes?.color, product.catalogue?.attributes?.size, product.catalogue?.attributes?.curtainType].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())).slice(0, 4)
    : []

  const clearFilters = () => setFilter({ room: '', opacity: '', fabric: '' })
  const activeFilters = Object.values(filter).filter(Boolean).length

  return (
    <div className="catalogue-shell">
      <section className="catalogue-hero">
        <div>
          <p className="catalogue-kicker"><span />Curtains for every kind of home</p>
          <h1>Find the feeling<br />you want to <em>come home to.</em></h1>
          <p className="catalogue-lead">Shop light-filtering sheers, room-darkening curtains and finished door drapes with clear, useful details at every step.</p>
        </div>
        <div className="catalogue-hero-note"><Sparkles size={18} /><span><strong>Need help deciding?</strong> Start with your room, then choose the light you want.</span></div>
      </section>

      <section className="catalogue-main">
        <div className="catalogue-toolbar">
          <p><strong>{filteredProducts.length}</strong> curtains, chosen for real rooms</p>
          <div className="catalogue-search relative"><Search size={17} /><input value={search} onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)} onChange={(event) => setSearch(event.target.value)} onFocus={() => setSearchFocused(true)} placeholder="Search curtains" aria-label="Search curtains" />{searchFocused && suggestions.length > 0 ? <div className="absolute left-0 top-[calc(100%+8px)] z-20 grid w-full overflow-hidden rounded-xl border border-alemah-sand bg-[#fffdfa] p-1 shadow-xl">{suggestions.map((product) => <Link className="px-3 py-2 text-sm font-semibold text-alemah-espresso hover:bg-alemah-cream/70" href={`/products/${product.slug}`} key={product.id}>{product.title}</Link>)}</div> : null}</div>
          <button className="catalogue-filter-toggle" onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}><SlidersHorizontal size={16} /> Filters {activeFilters ? `(${activeFilters})` : ''}</button>
        </div>

        <div className="catalogue-layout">
          <aside className={`catalogue-filters ${mobileFiltersOpen ? 'is-open' : ''}`}>
            <div className="catalogue-filter-title"><strong>Refine your room</strong><button onClick={clearFilters}>Clear all</button></div>
            {filters.map(({ key, label, options }) => (
              <fieldset key={key}>
                <legend>{label}</legend>
                <div>{options.map((option) => <button key={option} className={filter[key] === option ? 'is-selected' : ''} onClick={() => setFilter((current) => ({ ...current, [key]: current[key] === option ? '' : option }))}>{option}</button>)}</div>
              </fieldset>
            ))}
          </aside>

          <div className="catalogue-grid">
            {filteredProducts.map((product, index) => {
              const attributes = product.catalogue?.attributes
              return (
                <Link className="catalogue-card" href={`/products/${product.slug}`} key={product.id}>
                  <div className="catalogue-card-image"><Image alt={product.catalogue?.visual?.alt || product.title} height={720} sizes="(max-width: 768px) 100vw, 33vw" src={imageFor(product, index)} width={1200} /><span>{attributes?.opacity || 'Everyday comfort'}</span><i><ArrowUpRight size={18} /></i></div>
                  <div className="catalogue-card-info"><p>{attributes?.curtainType || 'Curtain'} <b>·</b> {attributes?.color || 'Curated colour'}</p><h2>{product.title}</h2><div><strong>{formatINR(product.priceInINR)}</strong><span>{attributes?.size || 'Ready to hang'}</span></div></div>
                </Link>
              )
            })}
            {!filteredProducts.length && <div className="catalogue-empty"><X size={20} /><h2>Nothing matches that combination.</h2><p>Try removing a filter or searching for a different room.</p><button onClick={clearFilters}>Show all curtains</button></div>}
          </div>
        </div>
      </section>
    </div>
  )
}
