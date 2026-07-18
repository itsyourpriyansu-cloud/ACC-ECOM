import type { AdvisorProductVariant } from '../catalog/catalogue-types'

export function curtainFit(requiredHeightCm: number | null, product: AdvisorProductVariant) {
  if (!requiredHeightCm || !product.heightCm) return { compatible: null, approximate: false }
  const difference = product.heightCm - requiredHeightCm
  return { compatible: difference >= 0, approximate: difference >= 0 && difference > 25 }
}
