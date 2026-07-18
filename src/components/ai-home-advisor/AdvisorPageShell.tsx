'use client'

import Link from 'next/link'
import { LoaderCircle, Mic, RotateCcw, Send, ShoppingBag, Sparkles, X } from 'lucide-react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type {
  AdvisorCategoryOption,
  AdvisorRecommendation,
} from '@/lib/ai-home-advisor/catalog/catalogue-types'
import { emptyAdvisorIntent, type AdvisorIntent } from '@/lib/ai-home-advisor/intent-schema'
import './advisor.css'
import './advisor-comparison.css'
import './advisor-pwa.css'

type Message = { id: string; role: 'user' | 'assistant'; content: string }
const opening =
  'Tell me what you are trying to choose for your home. You can type naturally, use the microphone, or start with one of the options below.'

function money(value: number | null) {
  return value === null
    ? 'Price unavailable'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value / 100)
}

function AdvisorProductCard({ item }: { item: AdvisorRecommendation }) {
  const { addItem, isLoading } = useCart()
  const add = async () => {
    try {
      await addItem({ product: Number(item.familyId), variant: item.variantId || undefined })
      toast.success('Added to your bag.')
    } catch {
      toast.error('Could not add this item. Please try from the product page.')
    }
  }
  return (
    <article className="advisor-product-card">
      <div className="advisor-product-image">
        {item.imageUrl ? (
          <img alt={item.title} src={item.imageUrl} />
        ) : (
          <span>Image coming soon</span>
        )}
        <b>
          {item.score}% · {item.matchLabel}
        </b>
      </div>
      <div className="advisor-product-copy">
        <h3>{item.title}</h3>
        <p className="advisor-product-meta">
          {[
            item.attributes.size,
            item.colour,
            item.packQuantity ? `Pack of ${item.packQuantity}` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Details available on product page'}
        </p>
        <strong>{money(item.sellingPricePaise)}</strong>
        <ul>
          {item.reasons.map((reason) => (
            <li key={reason}>✓ {reason}</li>
          ))}
        </ul>
        {item.warning ? <p className="advisor-warning">Important: {item.warning}</p> : null}
        <div className="advisor-product-actions">
          <Link
            href={item.variantId ? `${item.productUrl}?variant=${item.variantId}` : item.productUrl}
          >
            View product
          </Link>
          <button disabled={isLoading} onClick={() => void add()} type="button">
            <ShoppingBag size={15} /> Add to bag
          </button>
        </div>
      </div>
    </article>
  )
}

function AdvisorComparison({ items }: { items: AdvisorRecommendation[] }) {
  const fields: Array<[string, (item: AdvisorRecommendation) => string]> = [
    ['Size', (item: AdvisorRecommendation) => String(item.attributes.size || 'Not listed')],
    ['Light & privacy', (item: AdvisorRecommendation) => item.opacity || 'Not listed'],
    ['Fabric', (item: AdvisorRecommendation) => item.material || 'Not listed'],
    [
      'Pack',
      (item: AdvisorRecommendation) =>
        item.packQuantity ? `Pack of ${item.packQuantity}` : 'Not listed',
    ],
    ['Price', (item: AdvisorRecommendation) => money(item.sellingPricePaise)],
  ]
  return (
    <section className="advisor-comparison">
      <h3>Compare these matches</h3>
      <div className="advisor-comparison-grid">
        <div className="advisor-comparison-labels">
          {fields.map(([label]) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        {items.slice(0, 3).map((item) => (
          <div className="advisor-comparison-product" key={item.id}>
            <strong>{item.title}</strong>
            {fields.map(([label, value]) => (
              <span key={label}>{value(item)}</span>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export function AdvisorPageShell() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'opening', role: 'assistant', content: opening },
  ])
  const [requirement, setRequirement] = useState<AdvisorIntent>(emptyAdvisorIntent)
  const [categories, setCategories] = useState<AdvisorCategoryOption[]>([])
  const [shortcuts, setShortcuts] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<AdvisorRecommendation[]>([])
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/ai-home-advisor/catalogue-options')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) {
          setCategories(data.categories || [])
          setShortcuts(data.curtainShortcuts || [])
        }
      })
      .catch(() => undefined)
  }, [])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, recommendations, loading])
  const progress = useMemo(
    () =>
      [
        requirement.categorySlug,
        requirement.room,
        requirement.needs.length,
        requirement.measurements.heightCm,
        requirement.budgetMaxPaise,
      ].filter(Boolean).length,
    [requirement],
  )
  const choices =
    messages.length === 1
      ? [...categories.map((item) => item.label), "I'm not sure", ...shortcuts]
      : [
          requirement.nextQuestion ? 'Skip' : 'Show my matches',
          'Need privacy',
          'Soft daylight',
          'Shopping within a budget',
        ]

  const send = async (content = draft) => {
    const clean = content.trim()
    if (!clean || loading) return
    setDraft('')
    const nextMessages = [
      ...messages,
      { id: crypto.randomUUID(), role: 'user' as const, content: clean },
    ].slice(-10)
    setMessages(nextMessages)
    setLoading(true)
    try {
      const response = await fetch('/api/ai-home-advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          currentRequirement: requirement,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setRequirement(data.intent)
      setMessages((current) =>
        [
          ...current,
          { id: crypto.randomUUID(), role: 'assistant' as const, content: data.message },
        ].slice(-10),
      )
      if (!data.intent.nextQuestion) void getRecommendations(data.intent)
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content:
            'AI conversation is temporarily unavailable, but you can still use the guided product finder.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }
  const getRecommendations = async (intent = requirement) => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai-home-advisor/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement: intent }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error()
      setRecommendations(data.recommendations || [])
      setMessages((current) =>
        current.at(-1)?.content === data.message
          ? current
          : [
              ...current,
              { id: crypto.randomUUID(), role: 'assistant' as const, content: data.message },
            ].slice(-10),
      )
    } catch {
      toast.error('I could not check the catalogue. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  const choose = (choice: string) => {
    if (choice === 'Show my matches') void getRecommendations()
    else if (choice === 'Skip') void send('No preference, please continue')
    else void send(choice)
  }
  const reset = () => {
    setMessages([{ id: 'opening', role: 'assistant', content: opening }])
    setRequirement(emptyAdvisorIntent())
    setRecommendations([])
    setDraft('')
    setSummaryOpen(false)
  }
  const mic = () => {
    const Recognition =
      typeof window !== 'undefined'
        ? (
            window as typeof window & {
              webkitSpeechRecognition?: new () => {
                continuous: boolean
                interimResults: boolean
                lang: string
                start: () => void
                onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
                onend: () => void
                onerror: () => void
              }
            }
          ).webkitSpeechRecognition
        : undefined
    if (!Recognition) {
      toast.message('Voice typing is not available in this browser.')
      return
    }
    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-IN'
    setListening(true)
    recognition.onresult = (event) => setDraft(event.results[0][0].transcript)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      toast.error('Voice typing could not start.')
    }
    recognition.start()
  }
  return (
    <section className="advisor-shell">
      <aside className={`advisor-summary ${summaryOpen ? 'is-open' : ''}`}>
        <button
          className="advisor-summary-close"
          onClick={() => setSummaryOpen(false)}
          type="button"
        >
          <X size={18} />
        </button>
        <p className="advisor-eyebrow">
          <Sparkles size={14} /> Alemah AI Home Advisor
        </p>
        <h1>Choose what feels right at home.</h1>
        <p className="advisor-intro">
          A quieter way to compare real Alemah products by fit, room, colour, light and budget.
        </p>
        <div className="advisor-progress">
          <span>Consultation progress</span>
          <b>{progress}/5</b>
          <i>
            <em style={{ width: `${progress * 20}%` }} />
          </i>
        </div>
        <dl>
          <div>
            <dt>Category</dt>
            <dd>{requirement.categorySlug || 'Not chosen'}</dd>
          </div>
          <div>
            <dt>Room</dt>
            <dd>{requirement.room || 'Not chosen'}</dd>
          </div>
          <div>
            <dt>Need</dt>
            <dd>{requirement.needs.join(', ') || 'Not chosen'}</dd>
          </div>
          <div>
            <dt>Measurements</dt>
            <dd>
              {requirement.measurements.heightCm
                ? `${requirement.measurements.heightCm} cm drop`
                : 'Not entered'}
            </dd>
          </div>
          <div>
            <dt>Budget</dt>
            <dd>
              {requirement.budgetMaxPaise ? money(requirement.budgetMaxPaise) : 'No preference'}
            </dd>
          </div>
        </dl>
        <button className="advisor-reset" onClick={reset} type="button">
          <RotateCcw size={15} /> Start fresh
        </button>
        <p className="advisor-privacy">
          Your conversation is temporary and clears when you refresh or leave this page. Alemah does
          not save this chat.
        </p>
      </aside>
      <div className="advisor-chat-panel">
        <header>
          <button
            className="advisor-mobile-summary"
            onClick={() => setSummaryOpen(true)}
            type="button"
          >
            Your requirement · {progress}/5
          </button>
          <span>Real catalogue guidance</span>
        </header>
        <div className="advisor-timeline" ref={scrollRef}>
          {messages.map((message) => (
            <div className={`advisor-message ${message.role}`} key={message.id}>
              {message.content}
            </div>
          ))}
          {loading ? (
            <div className="advisor-message assistant">
              <LoaderCircle className="animate-spin" size={16} /> Looking at your requirements…
            </div>
          ) : null}
          {recommendations.length ? (
            <div className="advisor-recommendations">
              {recommendations.map((item) => (
                <AdvisorProductCard item={item} key={item.id} />
              ))}
              {recommendations.length > 1 ? <AdvisorComparison items={recommendations} /> : null}
            </div>
          ) : null}
        </div>
        <div className="advisor-composer-wrap">
          <div className="advisor-choices">
            {choices.slice(0, 8).map((choice) => (
              <button key={choice} onClick={() => choose(choice)} type="button">
                {choice}
              </button>
            ))}
          </div>
          <form
            className="advisor-composer"
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}
          >
            <button
              aria-label="Use voice typing"
              className={listening ? 'is-listening' : ''}
              onClick={mic}
              type="button"
            >
              <Mic size={18} />
            </button>
            <input
              aria-label="Tell Alemah what you need"
              maxLength={1000}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Describe your room, size, colour or budget…"
              value={draft}
            />
            <button aria-label="Send message" disabled={!draft.trim() || loading} type="submit">
              <Send size={18} />
            </button>
          </form>
          <p>
            AI suggestions use current catalogue data. Please verify measurements before ordering.
          </p>
        </div>
      </div>
    </section>
  )
}
