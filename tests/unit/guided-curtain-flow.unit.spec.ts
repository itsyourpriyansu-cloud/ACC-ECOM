import { describe, expect, it } from 'vitest'

import type { AdvisorProductVariant } from '@/lib/ai-home-advisor/catalog/catalogue-types'
import { availableColourFamilies, availableLengths, availableLightPreferences, emptyCurtainFinderState, filterCurtainCandidates, resetDependentAnswers } from '@/lib/ai-home-advisor/guided/curtain-flow'

const product = (overrides: Partial<AdvisorProductVariant> = {}): AdvisorProductVariant => ({
  id: '1:product', familyId: '1', variantId: null, title: 'Window curtain', productUrl: '/products/window', imageUrl: null,
  published: true, available: true, inventoryQuantity: 4, sellingPricePaise: 90000, categorySlug: 'curtains', categoryName: 'Curtains', productType: 'Window', roomTags: ['Bedroom'], useCaseTags: ['Light Filtering', 'Window'], colour: 'Ash Grey', colourFamilies: ['neutral'], material: 'Cotton', pattern: 'Fine Striped', styleTags: [], widthCm: null, heightCm: 152, lengthCm: 152, packQuantity: 2, opacity: 'Light Filtering', closureType: 'Button tab', installation: null, attributes: { size: '5 Feet' }, ...overrides,
})

describe('guided curtain flow', () => {
  const windowCurtain = product()
  const doorCurtain = product({ id: '2:product', familyId: '2', productType: 'Door', useCaseTags: ['Room Darkening', 'Door'], opacity: 'Room Darkening', colour: 'Maroon', colourFamilies: ['warm'], heightCm: 213, lengthCm: 213, attributes: { size: '7 Feet' } })
  it('window selection removes door products', () => expect(filterCurtainCandidates([windowCurtain, doorCurtain], { ...emptyCurtainFinderState(), installationType: 'window' })).toEqual([windowCurtain]))
  it('door selection removes window products', () => expect(filterCurtainCandidates([windowCurtain, doorCurtain], { ...emptyCurtainFinderState(), installationType: 'door' })).toEqual([doorCurtain]))
  it('builds length options only from current candidates', () => expect(availableLengths([windowCurtain, doorCurtain])).toEqual([60, 84]))
  it('hides blackout when no verified blackout product exists', () => expect(availableLightPreferences([windowCurtain, doorCurtain])).not.toContain('blackout'))
  it('hides unavailable colour families', () => expect(availableColourFamilies([windowCurtain])).toEqual(['neutral']))
  it('clears dependent answers after installation changes', () => {
    const state = { ...emptyCurtainFinderState(), installationType: 'window' as const, requiredLengthInches: 60, opacityPreference: 'bright' as const, colourFamily: 'neutral' as const }
    expect(resetDependentAnswers(state, 'installationType').requiredLengthInches).toBeNull()
  })
  it('does not claim an exact width when product width is missing', () => expect(windowCurtain.widthCm).toBeNull())
  it('skips budget filtering when a live price is missing', () => expect(filterCurtainCandidates([product({ sellingPricePaise: null })], { ...emptyCurtainFinderState(), budgetMaxPaise: 100000 })).toHaveLength(1))
})
