import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Category, Product, Variant } from '@/payload-types'
import { readCache, writeCache } from './catalogue-cache'
import type { AdvisorProductVariant } from './catalogue-types'

const text = (value?: string | null) => value?.trim() || null
const tags = (...values: Array<string | null | undefined>) => values.flatMap((value) => value ? value.split(/[,/|]/).map((item) => item.trim()).filter(Boolean) : [])
const toCm = (size?: string | null, inches?: number | null) => {
  if (typeof inches === 'number' && inches > 0) return Math.round(inches * 2.54)
  const feet = size?.match(/(\d+(?:\.\d+)?)\s*(?:feet|foot|ft)/i)
  if (feet) return Math.round(Number(feet[1]) * 30.48)
  const cm = size?.match(/(\d+(?:\.\d+)?)\s*cm/i)
  return cm ? Math.round(Number(cm[1])) : null
}
const categoryFrom = (product: Product) => {
  const category = product.categories?.find((item): item is Category => typeof item === 'object')
  const type = text(product.catalogue?.attributes?.curtainType)
  return { name: category?.title || (type ? 'Curtains' : null), slug: category?.slug || (type ? 'curtains' : null) }
}
const imageFrom = (product: Product) => product.catalogue?.visual?.stockImageUrl || (typeof product.gallery?.[0]?.image === 'object' ? product.gallery[0].image?.url || null : null)

function normalise(product: Product, variant?: Variant): AdvisorProductVariant {
  const attributes = product.catalogue?.attributes
  const category = categoryFrom(product)
  const price = variant?.priceInINR ?? product.priceInINR ?? null
  const inventory = variant?.inventory ?? product.inventory ?? null
  const title = variant?.title ? `${product.title} — ${variant.title}` : product.title
  return {
    id: `${product.id}:${variant?.id || 'product'}`,
    familyId: String(product.id),
    variantId: variant?.id || null,
    title,
    productUrl: `/products/${product.slug}`,
    imageUrl: imageFrom(product),
    published: product._status === 'published' && (!variant || variant._status === 'published'),
    available: typeof inventory === 'number' ? inventory > 0 : null,
    inventoryQuantity: typeof inventory === 'number' ? inventory : null,
    sellingPricePaise: typeof price === 'number' ? price : null,
    categorySlug: category.slug,
    categoryName: category.name,
    productType: text(attributes?.curtainType),
    roomTags: tags(attributes?.recommendedRoom),
    useCaseTags: tags(attributes?.opacity, attributes?.curtainType),
    colour: text(attributes?.color),
    colourFamilies: tags(attributes?.colorFamily, attributes?.color),
    material: text(attributes?.fabric),
    pattern: text(attributes?.pattern),
    styleTags: tags(attributes?.styleNote),
    widthCm: null,
    heightCm: toCm(attributes?.size, attributes?.sizeInches),
    lengthCm: toCm(attributes?.size, attributes?.sizeInches),
    packQuantity: attributes?.packOf || null,
    opacity: text(attributes?.opacity),
    closureType: text(attributes?.closureType),
    installation: text(attributes?.installation),
    attributes: {
      size: attributes?.size || null, fabric: attributes?.fabric || null, pattern: attributes?.pattern || null,
      opacity: attributes?.opacity || null, color: attributes?.color || null, colorFamily: attributes?.colorFamily || null,
      recommendedRoom: attributes?.recommendedRoom || null, packOf: attributes?.packOf || null,
      closureType: attributes?.closureType || null, installation: attributes?.installation || null,
    },
  }
}

export async function getAdvisorCatalogue(): Promise<AdvisorProductVariant[]> {
  const cached = readCache<AdvisorProductVariant[]>('advisor-catalogue')
  if (cached) return cached
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({ collection: 'products', depth: 2, limit: 250, pagination: false, overrideAccess: false, where: { _status: { equals: 'published' } } })
  const products = result.docs as Product[]
  const entries = products.flatMap((product) => {
    const variants = product.enableVariants ? (product.variants?.docs || []).filter((variant): variant is Variant => typeof variant === 'object') : []
    return variants.length ? variants.map((variant) => normalise(product, variant)) : [normalise(product)]
  }).filter((item) => item.published && Boolean(item.productUrl))
  return writeCache('advisor-catalogue', entries)
}
