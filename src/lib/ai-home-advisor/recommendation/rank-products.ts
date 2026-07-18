import type { AdvisorIntent } from '../intent-schema'
import { curtainFit } from '../calculators/curtain-fit'
import type { AdvisorProductVariant, AdvisorRecommendation } from '../catalog/catalogue-types'

const has = (values: string[], needles: string[]) => needles.some((needle) => values.some((value) => value.toLowerCase().includes(needle.toLowerCase())))

export function rankAdvisorProducts(intent: AdvisorIntent, products: AdvisorProductVariant[]): AdvisorRecommendation[] {
  const candidates = products.filter((product) => {
    if (!product.published || product.available === false) return false
    if (intent.categorySlug && product.categorySlug !== intent.categorySlug) return false
    if (intent.budgetMaxPaise && (!product.sellingPricePaise || product.sellingPricePaise > intent.budgetMaxPaise)) return false
    if (intent.needs.length && !has(product.useCaseTags, intent.needs)) return false
    if (intent.categorySlug === 'curtains' && intent.measurements.heightCm && curtainFit(intent.measurements.heightCm, product).compatible === false) return false
    return true
  })
  const scored = candidates.map((product) => {
    let score = 2
    const reasons: string[] = []
    if (!intent.categorySlug || product.categorySlug === intent.categorySlug) { score += 25; if (product.categoryName) reasons.push(`Matches ${product.categoryName.toLowerCase()}`) }
    if (intent.categorySlug && !intent.room && !intent.needs.length && !intent.preferredColours.length && !intent.preferredPatterns.length && !intent.budgetMaxPaise && !intent.measurements.heightCm) { score += 28; reasons.push('Currently published in this category') }
    const fit = intent.categorySlug === 'curtains' ? curtainFit(intent.measurements.heightCm, product) : { compatible: null, approximate: false }
    if (fit.compatible === true && intent.measurements.heightCm && product.heightCm) {
      const difference = product.heightCm - intent.measurements.heightCm
      score += difference <= 3 ? 25 : 12
      reasons.push(difference <= 3 ? 'Exact curtain drop match' : 'Longer than your entered drop')
    }
    if (intent.room && has(product.roomTags, [intent.room])) { score += 10; reasons.push(`Suitable for a ${intent.room}`) }
    if (intent.needs.length && has(product.useCaseTags, intent.needs)) { score += 15; if (product.opacity) reasons.push(`${product.opacity} fabric is verified in the listing`) }
    if (intent.preferredColours.length && has(product.colourFamilies, intent.preferredColours)) { score += 8; if (product.colour) reasons.push(`Colour: ${product.colour}`) }
    if (intent.preferredPatterns.length && product.pattern && has([product.pattern], intent.preferredPatterns)) { score += 5; reasons.push(`Pattern: ${product.pattern}`) }
    if (intent.budgetMaxPaise && product.sellingPricePaise && product.sellingPricePaise <= intent.budgetMaxPaise) { score += 10; reasons.push('Within your stated budget') }
    if (product.sellingPricePaise !== null && product.imageUrl && product.heightCm) score += 2
    const warning = fit.compatible === null && intent.categorySlug === 'curtains' ? 'Exact fit is not confirmed because a verified length is unavailable.' : fit.approximate ? 'This length is longer than your entered drop; please confirm the desired hem position.' : product.available === null ? 'Availability not confirmed.' : null
    return { ...product, score: Math.min(score, 100), reasons: reasons.slice(0, 4), warning }
  }).filter((item) => item.score >= 55)
  const uniqueFamilies = new Set<string>()
  return scored.sort((a, b) => b.score - a.score).filter((item) => !uniqueFamilies.has(item.familyId) && Boolean(uniqueFamilies.add(item.familyId))).slice(0, 3).map((item) => ({ ...item, matchLabel: item.score >= 85 ? 'Excellent match' : item.score >= 70 ? 'Strong match' : 'Possible match' }))
}
