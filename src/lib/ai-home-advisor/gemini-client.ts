import 'server-only'

import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { advisorGeminiResponseSchema, type AdvisorGeminiResponse, type AdvisorIntent } from './intent-schema'
import { advisorSystemInstructions } from './system-instructions'

const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash'

type TemporaryMessage = { role: 'user' | 'assistant'; content: string }

const jsonText = (value: string) => value.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()

function normaliseGeminiPayload(value: unknown) {
  if (!value || typeof value !== 'object') return value
  const data = value as Record<string, unknown>
  const allowedIntents = new Set(['discover-category', 'product-recommendation', 'compare-products', 'size-help', 'style-help', 'budget-help', 'product-question', 'unknown'])
  const intent = typeof data.intent === 'string' && allowedIntents.has(data.intent) ? data.intent : 'product-recommendation'
  const categoryAliases: Record<string, string> = { curtain: 'curtains', bedsheet: 'bedsheets', cushion: 'cushion-covers', pillowcase: 'pillowcases' }
  const categorySlug = typeof data.categorySlug === 'string' ? (categoryAliases[data.categorySlug.toLowerCase()] || data.categorySlug.toLowerCase()) : data.categorySlug
  const preferredColours = Array.isArray(data.preferredColours) ? data.preferredColours : Array.isArray(data.preferredColors) ? data.preferredColors : []
  const budget = data.budget && typeof data.budget === 'object' ? data.budget as Record<string, unknown> : {}
  return {
    ...data,
    intent,
    categorySlug,
    preferredColours,
    budgetMinPaise: data.budgetMinPaise ?? budget.minPaise ?? null,
    budgetMaxPaise: data.budgetMaxPaise ?? budget.maxPaise ?? null,
    conversationalReply: typeof data.conversationalReply === 'string' ? data.conversationalReply : 'I understand what you are looking for.',
  }
}

export async function extractAdvisorIntent(messages: TemporaryMessage[], current: AdvisorIntent): Promise<AdvisorGeminiResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  const ai = new GoogleGenAI({ apiKey })
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Current requirement JSON:\n${JSON.stringify(current)}\n\nTemporary conversation (do not repeat or store it):\n${messages.slice(-8).map((item) => `${item.role}: ${item.content}`).join('\n')}`,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: advisorSystemInstructions,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        maxOutputTokens: 2048,
      },
    })
    return advisorGeminiResponseSchema.safeParse(normaliseGeminiPayload(JSON.parse(jsonText(response.text || '')))).data || null
  } catch (error) {
    console.error('AI home advisor intent extraction failed', error instanceof Error ? error.name : 'unknown')
    return null
  }
}
