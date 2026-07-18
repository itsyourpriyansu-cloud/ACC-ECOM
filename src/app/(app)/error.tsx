'use client'

import React from 'react'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-12 flex max-w-xl flex-col rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-8 text-center shadow-sm md:p-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-alemah-red-600">A small interruption</p>
      <h2 className="mt-3 font-serif text-4xl text-alemah-espresso">Let’s try that again.</h2>
      <p className="mx-auto my-4 max-w-sm text-sm leading-6 text-alemah-taupe">The storefront could not complete that action. Your bag and account are safe—please retry.</p>
      <button
        className="mx-auto mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-alemah-red-600 px-5 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-alemah-red-700"
        onClick={() => reset()}
        type="button"
      >
        Try Again
      </button>
    </div>
  )
}
