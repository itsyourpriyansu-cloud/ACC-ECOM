import type { Metadata } from 'next'

import { GuidedAdvisor } from '@/components/ai-home-advisor/GuidedAdvisor'

export const metadata: Metadata = {
  title: 'AI Home Textile Advisor | Find Curtains That Fit | Alemah',
  description: 'Use Alemah’s AI Home Advisor to compare curtains by size, room, colour, light control and budget using products currently available in the Alemah catalogue.',
}

export default function AIHomeAdvisorPage() {
  return <><GuidedAdvisor /><section className="mx-auto mb-24 max-w-5xl px-5 text-sm leading-7 text-alemah-taupe sm:px-8"><h2 className="font-serif text-3xl text-alemah-espresso">A considered way to choose curtains</h2><p className="mt-3">Alemah Home Advisor compares the currently published catalogue using verified listing details such as size, colour, fabric, light control, pack quantity and price. It does not invent product facts or save your conversation.</p><div className="mt-8 grid gap-7 md:grid-cols-3"><div><h3 className="font-semibold text-alemah-espresso">How recommendations work</h3><p>Products are filtered for publication, availability where known, fit, budget and the details you choose.</p></div><div><h3 className="font-semibold text-alemah-espresso">Measure curtains first</h3><p>Measure from the rod to your preferred hem. For a fuller finish, curtain width is usually 1.5–2× the rod width.</p></div><div><h3 className="font-semibold text-alemah-espresso">Know your light control</h3><p>Sheers soften daylight, light-filtering fabric adds privacy, and room-darkening or blackout claims are shown only when verified in a listing.</p></div></div><h2 className="mt-10 font-serif text-2xl text-alemah-espresso">Questions customers ask</h2><details className="mt-3 border-b border-alemah-sand py-3"><summary className="cursor-pointer font-semibold text-alemah-espresso">Does this save my chat?</summary><p>No. This consultation exists only in this browser page and clears when you refresh or leave.</p></details><details className="border-b border-alemah-sand py-3"><summary className="cursor-pointer font-semibold text-alemah-espresso">Can I buy a recommendation?</summary><p>Yes. Each recommendation links to its real product page and only adds to your bag after you choose the button.</p></details></section></>
}
