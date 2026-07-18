export type AdvisorProductVariant = {
  id: string
  familyId: string
  variantId: number | null
  title: string
  productUrl: string
  imageUrl: string | null
  published: boolean
  available: boolean | null
  inventoryQuantity: number | null
  sellingPricePaise: number | null
  categorySlug: string | null
  categoryName: string | null
  productType: string | null
  roomTags: string[]
  useCaseTags: string[]
  colour: string | null
  colourFamilies: string[]
  material: string | null
  pattern: string | null
  styleTags: string[]
  widthCm: number | null
  heightCm: number | null
  lengthCm: number | null
  packQuantity: number | null
  opacity: string | null
  closureType: string | null
  installation: string | null
  attributes: Record<string, string | number | boolean | string[] | null>
}

export type AdvisorCategoryOption = { slug: string; label: string; count: number }

export type AdvisorRecommendation = AdvisorProductVariant & {
  score: number
  matchLabel: 'Excellent match' | 'Strong match' | 'Possible match'
  reasons: string[]
  warning: string | null
}
