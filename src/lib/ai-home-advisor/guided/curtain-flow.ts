import type { AdvisorProductVariant } from '../catalog/catalogue-types'

export type InstallationType = 'window' | 'door' | 'balcony-long-door' | null
export type LightPreference = 'bright' | 'more-private' | 'blackout' | null
export type ColourFamily = 'neutral' | 'warm' | 'blue' | 'green' | 'pastel' | 'bright' | 'other' | 'all' | null
export type PatternPreference = 'fine-striped' | 'striped' | 'multi-striped' | 'checkered' | 'solid' | 'all' | null

export type CurtainFinderState = {
  installationType: InstallationType
  requiredLengthInches: number | null
  opacityPreference: LightPreference
  colourFamily: ColourFamily
  pattern: PatternPreference
  budgetMinPaise: number | null
  budgetMaxPaise: number | null
}

export const emptyCurtainFinderState = (): CurtainFinderState => ({ installationType: null, requiredLengthInches: null, opacityPreference: null, colourFamily: null, pattern: null, budgetMinPaise: null, budgetMaxPaise: null })
export const inchesFor = (product: AdvisorProductVariant) => product.heightCm ? Math.round(product.heightCm / 2.54) : null
export const labelForLength = (inches: number) => `${Math.round(inches / 12 * 10) / 10} Feet · ${inches} inches`

const text = (product: AdvisorProductVariant) => `${product.productType || ''} ${product.opacity || ''} ${product.pattern || ''} ${product.colour || ''} ${product.styleTags.join(' ')}`.toLowerCase()
export const colourFamilyFor = (product: AdvisorProductVariant): Exclude<ColourFamily, null | 'all'> => {
  const value = `${product.colour || ''} ${product.colourFamilies.join(' ')}`.toLowerCase()
  if (/grey|gray|beige|white|black|neutral|cream/.test(value)) return 'neutral'
  if (/maroon|ruby|brown|rust|gold|red/.test(value)) return 'warm'
  if (/blue|sea/.test(value)) return 'blue'
  if (/green/.test(value)) return 'green'
  if (/pink|pastel|muted/.test(value)) return 'pastel'
  if (/yellow|bright|multi/.test(value)) return 'bright'
  return 'other'
}
export const patternFor = (product: AdvisorProductVariant): Exclude<PatternPreference, null | 'all'> => {
  const value = text(product)
  if (/fine.*stripe/.test(value)) return 'fine-striped'
  if (/multi.*stripe/.test(value)) return 'multi-striped'
  if (/check/.test(value)) return 'checkered'
  if (/solid/.test(value)) return 'solid'
  return 'striped'
}
export const opacityFor = (product: AdvisorProductVariant): LightPreference | null => {
  const value = (product.opacity || '').toLowerCase()
  if (/blackout/.test(value)) return 'blackout'
  if (/room.?dark/.test(value)) return 'more-private'
  if (/semi.?sheer|light.?filter/.test(value)) return 'bright'
  return null
}

export function filterCurtainCandidates(products: AdvisorProductVariant[], state: CurtainFinderState) {
  return products.filter((product) => {
    if (!product.published || product.available === false || product.categorySlug !== 'curtains') return false
    const value = text(product)
    if (state.installationType === 'window' && !/window/.test(value)) return false
    if (state.installationType === 'door' && (!/door/.test(value) || /long|extra long|9 feet|8 feet/.test(value))) return false
    if (state.installationType === 'balcony-long-door' && (!/door/.test(value) || (!/long|extra long/.test(value) && (product.heightCm || 0) < 213))) return false
    if (state.requiredLengthInches && inchesFor(product) !== state.requiredLengthInches) return false
    if (state.opacityPreference && opacityFor(product) !== state.opacityPreference) return false
    if (state.colourFamily && state.colourFamily !== 'all' && colourFamilyFor(product) !== state.colourFamily) return false
    if (state.pattern && state.pattern !== 'all' && patternFor(product) !== state.pattern) return false
    if (state.budgetMaxPaise && product.sellingPricePaise !== null && product.sellingPricePaise > state.budgetMaxPaise) return false
    return true
  })
}

export function availableLengths(products: AdvisorProductVariant[]) { return [...new Set(products.map(inchesFor).filter((value): value is number => value !== null))].sort((a, b) => a - b) }
export function availableColourFamilies(products: AdvisorProductVariant[]) { return [...new Set(products.map(colourFamilyFor))] }
export function availablePatterns(products: AdvisorProductVariant[]) { return [...new Set(products.map(patternFor))] }
export function availableLightPreferences(products: AdvisorProductVariant[]): Exclude<LightPreference, null>[] { return [...new Set(products.map(opacityFor).filter((value): value is Exclude<LightPreference, null> => value !== null))] }

export function resetDependentAnswers(state: CurtainFinderState, changed: keyof CurtainFinderState): CurtainFinderState {
  if (changed === 'installationType') return { ...state, requiredLengthInches: null, opacityPreference: null, colourFamily: null, pattern: null, budgetMinPaise: null, budgetMaxPaise: null }
  if (changed === 'requiredLengthInches') return { ...state, opacityPreference: null, colourFamily: null, pattern: null, budgetMinPaise: null, budgetMaxPaise: null }
  if (changed === 'opacityPreference') return { ...state, colourFamily: null, pattern: null, budgetMinPaise: null, budgetMaxPaise: null }
  if (changed === 'colourFamily') return { ...state, pattern: null, budgetMinPaise: null, budgetMaxPaise: null }
  return state
}
