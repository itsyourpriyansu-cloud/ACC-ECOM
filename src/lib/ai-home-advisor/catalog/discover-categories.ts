import { getAdvisorCatalogue } from './get-catalogue'
import type { AdvisorCategoryOption } from './catalogue-types'

export async function discoverAdvisorCategories(): Promise<AdvisorCategoryOption[]> {
  const products = await getAdvisorCatalogue()
  const grouped = new Map<string, AdvisorCategoryOption>()
  for (const product of products) {
    const slug = product.categorySlug || 'home-textiles'
    const current = grouped.get(slug)
    grouped.set(slug, { slug, label: product.categoryName || 'Home Textiles', count: (current?.count || 0) + 1 })
  }
  return [...grouped.values()].sort((a, b) => b.count - a.count)
}
