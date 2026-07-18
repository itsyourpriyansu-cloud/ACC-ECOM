import Link from 'next/link'
import type { ReactNode } from 'react'

type Section = {
  body: ReactNode
  title: string
}

export function InfoPage({
  eyebrow,
  sections,
  title,
}: {
  eyebrow: string
  sections: Section[]
  title: string
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-alemah-red-600">
        {eyebrow}
      </p>
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-alemah-espresso sm:text-5xl">
        {title}
      </h1>
      <div className="mt-10 space-y-9 text-sm leading-7 text-alemah-taupe sm:text-base">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-alemah-espresso">
              {section.title}
            </h2>
            {section.body}
          </section>
        ))}
      </div>
      <p className="mt-12 border-t border-alemah-sand pt-6 text-xs leading-5 text-alemah-taupe">
        Need help with an order? Use <Link className="text-alemah-red-600 underline" href="/find-order">Track your order</Link>{' '}
        or sign in to <Link className="text-alemah-red-600 underline" href="/account">your account</Link>.
      </p>
    </article>
  )
}
