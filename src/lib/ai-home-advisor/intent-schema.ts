import { z } from 'zod'

export const advisorIntentSchema = z.object({
  language: z.enum(['english', 'hindi', 'hinglish']).default('english'),
  intent: z.enum(['discover-category', 'product-recommendation', 'compare-products', 'size-help', 'style-help', 'budget-help', 'product-question', 'unknown']).default('unknown'),
  categorySlug: z.string().trim().max(80).nullable().default(null),
  productType: z.string().trim().max(100).nullable().default(null),
  room: z.string().trim().max(100).nullable().default(null),
  application: z.string().trim().max(100).nullable().default(null),
  needs: z.array(z.string().trim().max(100)).max(8).default([]),
  preferredColours: z.array(z.string().trim().max(80)).max(6).default([]),
  preferredPatterns: z.array(z.string().trim().max(80)).max(6).default([]),
  preferredMaterials: z.array(z.string().trim().max(80)).max(6).default([]),
  preferredStyles: z.array(z.string().trim().max(80)).max(6).default([]),
  budgetMinPaise: z.number().int().nonnegative().nullable().default(null),
  budgetMaxPaise: z.number().int().nonnegative().nullable().default(null),
  measurements: z.object({
    widthCm: z.number().positive().nullable().default(null),
    heightCm: z.number().positive().nullable().default(null),
    lengthCm: z.number().positive().nullable().default(null),
    mattressWidthCm: z.number().positive().nullable().default(null),
    mattressLengthCm: z.number().positive().nullable().default(null),
    mattressDepthCm: z.number().positive().nullable().default(null),
  }).default({ widthCm: null, heightCm: null, lengthCm: null, mattressWidthCm: null, mattressLengthCm: null, mattressDepthCm: null }),
  missingRequiredFields: z.array(z.string().trim().max(80)).max(8).default([]),
  nextQuestion: z.string().trim().max(500).nullable().default(null),
})

export type AdvisorIntent = z.infer<typeof advisorIntentSchema>

export const emptyAdvisorIntent = (): AdvisorIntent => advisorIntentSchema.parse({})

export const advisorMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(1000),
})

export const advisorChatRequestSchema = z.object({
  messages: z.array(advisorMessageSchema).max(10),
  currentRequirement: advisorIntentSchema,
})

export const advisorGeminiResponseSchema = advisorIntentSchema.extend({
  conversationalReply: z.string().trim().min(1).max(420),
})

export type AdvisorGeminiResponse = z.infer<typeof advisorGeminiResponseSchema>
