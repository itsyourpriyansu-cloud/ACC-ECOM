import { NextRequest, NextResponse } from 'next/server'

import { extractAdvisorIntent } from '@/lib/ai-home-advisor/gemini-client'
import { guidedReply, mergeHeuristicIntent, nextAdvisorQuestion } from '@/lib/ai-home-advisor/conversation-state'
import { advisorChatRequestSchema } from '@/lib/ai-home-advisor/intent-schema'

export const dynamic = 'force-dynamic'

const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 20

function rateLimited(request: NextRequest) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const current = attempts.get(key)
  if (!current || current.resetAt <= now) { attempts.set(key, { count: 1, resetAt: now + WINDOW_MS }); return false }
  current.count += 1
  return current.count > MAX_ATTEMPTS
}

export async function POST(request: NextRequest) {
  if (rateLimited(request)) return NextResponse.json({ message: 'Please wait a minute before sending another message.' }, { status: 429 })
  const parsed = advisorChatRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: 'Please send a short message and try again.' }, { status: 400 })
  const message = [...parsed.data.messages].reverse().find((item) => item.role === 'user')?.content
  if (!message) return NextResponse.json({ message: 'Please tell me what you need help choosing.' }, { status: 400 })
  const heuristic = mergeHeuristicIntent(parsed.data.currentRequirement, message)
  const extracted = await extractAdvisorIntent(parsed.data.messages, heuristic)
  const intent = extracted ? { ...heuristic, ...extracted, measurements: { ...heuristic.measurements, ...extracted.measurements } } : heuristic
  const nextQuestion = nextAdvisorQuestion(intent)
  const fallbackPrefix = process.env.GEMINI_API_KEY ? 'I could not read that fully, but ' : 'AI conversation is temporarily unavailable, but '
  const readyMessage = intent.language === 'hinglish' ? ' Main ab current catalogue mein closest verified matches check kar sakta hoon.' : intent.language === 'hindi' ? ' अब मैं वर्तमान कैटलॉग में सबसे करीब सत्यापित विकल्प देख सकता हूँ।' : ' I can now check the closest verified matches.'
  const messageText = extracted ? `${extracted.conversationalReply}${nextQuestion ? ` ${nextQuestion}` : readyMessage}` : `${fallbackPrefix}${guidedReply(intent)}`
  return NextResponse.json({ intent: { ...intent, nextQuestion, missingRequiredFields: nextQuestion ? [nextQuestion] : [] }, message: messageText, aiAvailable: Boolean(extracted) }, { headers: { 'Cache-Control': 'no-store' } })
}
