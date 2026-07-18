import { NextResponse } from 'next/server'

import { discoverAdvisorCategories } from '@/lib/ai-home-advisor/catalog/discover-categories'
import { getAdvisorCatalogue } from '@/lib/ai-home-advisor/catalog/get-catalogue'

export const revalidate = 60

export async function GET() {
  try {
    const [categories, variants] = await Promise.all([discoverAdvisorCategories(), getAdvisorCatalogue()])
    return NextResponse.json({ categories, variants, curtainShortcuts: categories.some((category) => category.slug === 'curtains') ? ['Need privacy', 'Want soft daylight', 'Want a darker bedroom', 'Need the correct curtain size', 'Need easy-to-hang curtains', 'Match curtains with my room', 'Shopping within a budget'] : [] }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
  } catch {
    return NextResponse.json({ message: 'The guided finder is temporarily unavailable.' }, { status: 503 })
  }
}
