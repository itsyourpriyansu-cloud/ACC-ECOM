'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function HeroCarousel() {
  const images = [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1600&q=80',
  ]

  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <section className="relative h-[80vh] min-h-[500px] w-full bg-alemah-cream/40 overflow-hidden select-none">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0 w-full h-full">
        {images.map((image, idx) => {
          const isActive = idx === current
          return (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1500 ease-in-out ${
                isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <Image
                src={image}
                alt="Alemah home textiles preview"
                fill
                priority={idx === 0}
                sizes="100vw"
                className="object-cover opacity-90"
              />
            </div>
          )
        })}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-alemah-ivory via-alemah-ivory/65 to-transparent z-10" />

      {/* Text Overlay */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center relative z-20">
        <div className="max-w-xl sm:max-w-2xl flex flex-col gap-5 items-start">
          <span className="font-sans text-xs sm:text-sm font-bold text-alemah-red-600 uppercase tracking-widest bg-alemah-red-100 px-3.5 py-1.5 rounded-full shadow-sm">
            Launch Collection
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-extrabold text-alemah-espresso leading-tight animate-fade-in">
            Pure Textile Art.
            <br />
            <span className="text-alemah-red-600 italic font-semibold">Legacy Craft.</span>
          </h1>
          <p className="font-sans text-base sm:text-lg text-alemah-taupe leading-relaxed">
            For over a decade, we&apos;ve crafted premium bedding and textiles. Welcome to our
            flagship digital home, woven direct from our looms to yours.
          </p>
          <div className="flex gap-4 mt-2">
            <Link
              href="/shop"
              className="h-12 px-7 bg-alemah-red-600 hover:bg-alemah-red-700 text-white font-sans text-sm font-semibold rounded-full ios-active-scale transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              Shop Collection
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/story"
              className="h-12 px-7 border border-alemah-sand bg-white/70 hover:bg-alemah-cream/40 text-alemah-espresso font-sans text-sm font-semibold rounded-full ios-active-scale transition-colors flex items-center justify-center cursor-pointer"
            >
              Our Story
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
