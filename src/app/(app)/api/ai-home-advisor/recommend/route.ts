import { NextRequest, NextResponse } from 'next/server'

import { getAdvisorCatalogue } from '@/lib/ai-home-advisor/catalog/get-catalogue'
import { advisorIntentSchema } from '@/lib/ai-home-advisor/intent-schema'
import { rankAdvisorProducts } from '@/lib/ai-home-advisor/recommendation/rank-products'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = advisorIntentSchema.safeParse(body?.requirement)
  if (!parsed.success) return NextResponse.json({ message: 'Your requirements need a quick refresh. Please try again.' }, { status: 400 })
  try {
    const candidateIDs = Array.isArray(body?.candidateIDs) ? body.candidateIDs.filter((id: unknown): id is string => typeof id === 'string' && id.length <= 80).slice(0, 100) : []
    const catalogue = await getAdvisorCatalogue()
    const verifiedCandidates = candidateIDs.length ? catalogue.filter((product) => candidateIDs.includes(product.id)) : catalogue
    const recommendations = rankAdvisorProducts(parsed.data, verifiedCandidates)
    const message = recommendations.length ? 'Here are the closest verified matches from the current Alemah catalogue.' : 'No exact published match is available with those requirements. Try relaxing the budget, colour, or curtain drop.'
    return NextResponse.json({ recommendations, message }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ message: 'I could not check the catalogue just now. Please try again.' }, { status: 503 })
  }
}
