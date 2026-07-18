'use client'

import { Ruler } from 'lucide-react'

import './curtain-size-guide.css'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type CurtainSizeGuideProps = {
  closureType?: string | null
  packOf?: number | null
  size?: string | null
}

export function CurtainSizeGuide({ closureType, packOf, size }: CurtainSizeGuideProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="curtain-size-guide-trigger" type="button"><Ruler size={15} /> Size & fit guide</button>
      </DialogTrigger>
      <DialogContent className="border-alemah-sand bg-[#fffdfa] p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-alemah-sand/50 px-6 py-6 text-left">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-alemah-red-600">A considered fit</p>
          <DialogTitle className="font-serif text-3xl text-alemah-espresso">How to choose your curtain size</DialogTitle>
          <DialogDescription className="mt-2 text-alemah-taupe">Measure the rod, not the window. A little extra width gives fabric room to fall beautifully.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 px-6 pb-7 pt-5 text-sm text-alemah-taupe">
          <ol className="grid gap-3">
            <li className="flex gap-3"><b className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-alemah-red-600 text-xs text-white">1</b><span><strong className="text-alemah-espresso">Measure your rod width.</strong> Include the space you want the curtains to cover when closed.</span></li>
            <li className="flex gap-3"><b className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-alemah-red-600 text-xs text-white">2</b><span><strong className="text-alemah-espresso">Choose 1.5–2× that width.</strong> This gives a relaxed, fuller finish instead of a flat panel.</span></li>
            <li className="flex gap-3"><b className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-alemah-red-600 text-xs text-white">3</b><span><strong className="text-alemah-espresso">Check the drop.</strong> Measure from the rod to the point where you want the hem to finish.</span></li>
          </ol>
          {(size || closureType || packOf) && <div className="mt-1 grid gap-2 rounded-xl border border-alemah-sand/60 bg-alemah-cream/40 p-4 text-xs"><strong className="text-alemah-espresso">This curtain</strong>{size ? <span>Ready-made size: {size}</span> : null}{packOf ? <span>Pack includes: {packOf} panel{packOf === 1 ? '' : 's'}</span> : null}{closureType ? <span>Heading / installation: {closureType}</span> : null}</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
