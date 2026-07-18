import { describe, expect, it } from 'vitest'

import { curtainFit } from '@/lib/ai-home-advisor/calculators/curtain-fit'
import { emptyAdvisorIntent, advisorIntentSchema } from '@/lib/ai-home-advisor/intent-schema'
import { rankAdvisorProducts } from '@/lib/ai-home-advisor/recommendation/rank-products'
import type { AdvisorProductVariant } from '@/lib/ai-home-advisor/catalog/catalogue-types'

const curtain = (overrides: Partial<AdvisorProductVariant> = {}): AdvisorProductVariant => ({
  id: '1:product', familyId: '1', variantId: null, title: 'Grey Light Filtering Curtain', productUrl: '/products/grey-curtain', imageUrl: null,
  published: true, available: true, inventoryQuantity: 4, sellingPricePaise: 180000, categorySlug: 'curtains', categoryName: 'Curtains', productType: 'Window Curtain', roomTags: ['Bedroom'], useCaseTags: ['Light filtering'], colour: 'Ash Grey', colourFamilies: ['Grey'], material: 'Polyester', pattern: 'Solid', styleTags: [], widthCm: null, heightCm: 152, lengthCm: 152, packQuantity: 2, opacity: 'Light filtering', closureType: 'Eyelet', installation: null, attributes: { size: '5 Feet' }, ...overrides,
})

describe('AI Home Advisor recommendation rules', () => {
  it('validates a safe empty intent', () => expect(advisorIntentSchema.safeParse(emptyAdvisorIntent()).success).toBe(true))
  it('does not claim an exact curtain fit without a known length', () => expect(curtainFit(152, curtain({ heightCm: null })).compatible).toBeNull())
  it('rejects a curtain shorter than the required drop', () => expect(curtainFit(180, curtain()).compatible).toBe(false))
  it('excludes unavailable, over-budget, and incompatible curtains', () => {
    const intent = { ...emptyAdvisorIntent(), categorySlug: 'curtains', budgetMaxPaise: 200000, measurements: { ...emptyAdvisorIntent().measurements, heightCm: 152 } }
    const results = rankAdvisorProducts(intent, [curtain(), curtain({ id: '2', familyId: '2', available: false }), curtain({ id: '3', familyId: '3', sellingPricePaise: 250000 }), curtain({ id: '4', familyId: '4', heightCm: 120 })])
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('1:product')
  })
  it('deduplicates product families', () => {
    const intent = { ...emptyAdvisorIntent(), categorySlug: 'curtains' }
    expect(rankAdvisorProducts(intent, [curtain(), curtain({ id: '1:variant', variantId: 99 })])).toHaveLength(1)
  })
  it('does not recommend an unverified functional claim', () => {
    const intent = { ...emptyAdvisorIntent(), categorySlug: 'curtains', needs: ['blackout'] }
    expect(rankAdvisorProducts(intent, [curtain({ opacity: 'Light filtering', useCaseTags: ['Light filtering'] })])).toEqual([])
  })
  it('supports unknown categories without crashing', () => {
    const intent = { ...emptyAdvisorIntent(), categorySlug: 'future-category' }
    expect(rankAdvisorProducts(intent, [curtain()])).toEqual([])
  })
})
