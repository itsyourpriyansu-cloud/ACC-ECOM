'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowRight, ChevronDown, Layers3, PackageCheck, Ruler,
  Sparkles, Sun, WashingMachine, Check, Info
} from 'lucide-react'

import type { Product } from '@/payload-types'
import ProductCard from '@/components/ProductCard'
import { curtainColors, shopLink } from '@/components/storefront-config'
import './alemah-home.css'

type Props = { products: Product[] }

const imagery = {
  hero: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1800&q=90',
  window: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=85',
  door: 'https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1200&q=85',
  stripe: 'https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1200&q=85',
  editorial: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1500&q=88',
} as const

const categories = [
  { title: 'Window Curtains', description: 'Everyday comfort for bedrooms and living spaces', image: imagery.window, href: shopLink({ type: 'window' }) },
  { title: 'Door Curtains', description: 'Full-length privacy with an elegant fall', image: imagery.door, href: shopLink({ type: 'door' }) },
  { title: 'Striped Curtains', description: 'Signature patterns for modern Indian homes', image: imagery.stripe, href: shopLink({ pattern: 'striped' }) },
  { title: 'Solid Curtains', description: 'Simple colors that blend effortlessly', image: imagery.editorial, href: shopLink({ pattern: 'solid' }) },
  { title: 'Room-Darkening', description: 'Added privacy and reduced outside light', image: imagery.door, href: shopLink({ light: 'darkening' }) },
  { title: 'Combos & Sets', description: 'Coordinated value packs for complete rooms', image: imagery.window, href: shopLink({ pack: '2' }) },
] as const

const sizeDetails = {
  '5 ft': {
    name: 'Window Curtain (5 ft)',
    drop: '5 feet / 152 cm',
    bestFor: 'Kitchens, study desks, and standard bedroom windows.',
    tip: 'Ends 4–6 inches below the window sill. Keeps desks/counters clear.',
    visualHeight: '52%',
    type: 'window',
  },
  '6 ft': {
    name: 'Short Door / Tall Window (6 ft)',
    drop: '6 feet / 183 cm',
    bestFor: 'Cottage entries, low-fitting doors, or tall arch windows.',
    tip: 'Hangs with full vertical coverage without touching baseboards.',
    visualHeight: '64%',
    type: 'window',
  },
  '6.5 ft': {
    name: 'Intermediate Door (6.5 ft)',
    drop: '6.5 feet / 198 cm',
    bestFor: 'Standard apartment bedrooms and dining dividers.',
    tip: 'Ensures standard clearance for high-traffic door pathways.',
    visualHeight: '70%',
    type: 'door',
  },
  '7 ft': {
    name: 'Standard Door (7 ft)',
    drop: '7 feet / 213 cm',
    bestFor: 'Main entry doors, standard balcony exits, and bedroom doors.',
    tip: 'The standard choice. Hangs cleanly with 1-2 cm of floor clearance.',
    visualHeight: '76%',
    type: 'door',
  },
  '8 ft': {
    name: 'French Door / High Passage (8 ft)',
    drop: '8 feet / 244 cm',
    bestFor: 'Patio sliders, double-height passages, and loft entries.',
    tip: 'Mount the rod higher above the frame to make the ceiling feel taller.',
    visualHeight: '88%',
    type: 'door',
  },
  '9 ft+': {
    name: 'Extra-Long / Grand Entrance (9 ft+)',
    drop: '9+ feet / 274+ cm',
    bestFor: 'High-ceiling living rooms, hotel-style lounge exits.',
    tip: 'Allows fabric to pool elegantly on the floor for an editorial look.',
    visualHeight: '100%',
    type: 'door',
  },
} as const

const lightDetails = {
  'Light Filtering': {
    name: 'Light Filtering',
    intensity: 'Soft daylight',
    description: 'Allows natural light to filter gently into your space, softening harsh glare while maintaining privacy and a bright, welcoming atmosphere.',
    ideal: 'Living rooms, kitchens, dining areas, and workspaces.',
    fabric: 'Breathable, lightweight 100% cotton weaves.',
    overlayBg: 'rgba(255, 253, 246, 0.1)',
  },
  'Room Darkening': {
    name: 'Room Darkening',
    intensity: 'Reduced light (Medium)',
    description: 'Significantly dampens outside light to create a cozy, dimmed setting. Ideal for bedroom rest or screen viewing.',
    ideal: 'Bedrooms, guest rooms, study rooms.',
    fabric: 'Medium-weight dense weave cotton or blend.',
    overlayBg: 'rgba(30, 20, 20, 0.55)',
  },
  'Blackout': {
    name: 'Blackout',
    intensity: 'Max reduction (High)',
    description: 'Blocks almost all incoming daylight. Helps maintain room temperature, reduces external noise, and ensures deep sleep.',
    ideal: 'Master bedrooms, media rooms, nurseries.',
    fabric: 'Heavy multi-layer woven panels.',
    overlayBg: 'rgba(15, 10, 10, 0.88)',
  },
} as const

const faqs = [
  ['How do I choose the correct curtain size?', 'Measure the curtain rod width, then allow approximately 1.5 to 2 times that width for a fuller fall. Check the listed ready-made length before ordering.'],
  ['What is the difference between light-filtering and blackout curtains?', 'Light-filtering curtains soften daylight. Room-darkening and any blackout performance are stated individually on product listings, so please use the product’s light-control detail when choosing.'],
  ['How do tab-top curtains work?', 'Tab-top curtains have fabric loops that slide directly onto a compatible curtain rod. Refer to the listing’s installation field for the applicable heading style.'],
  ['Are AlemAh curtains machine washable?', 'Care guidance varies by listing. Please follow the care details supplied for your selected curtain.'],
  ['Do curtain packs contain one panel or two?', 'Pack quantity is displayed on every product card and product page before you add the item to your bag.'],
  ['How long does delivery take?', 'Delivery timing is confirmed for an order after checkout. It is not currently published as a universal storefront promise.'],
  ['Can I return or exchange curtains?', 'Return and exchange eligibility is confirmed in the published policy and product information. Please check those details before ordering.'],
  ['How can I track my order?', 'Use Track Order with the order details associated with your purchase.'],
] as const

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="curtain-eyebrow"><span />{children}</p>
}

function SectionHeader({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: ReactNode }) {
  return (
    <div className="curtain-section-header">
      <div className="curtain-section-header__main">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2>{title}</h2>
      </div>
      <div className="curtain-section-header__aside">
        {copy && <p>{copy}</p>}
        {action && <div className="curtain-section-header__action">{action}</div>}
      </div>
    </div>
  )
}

export default function AlemahHome({ products }: Props) {
  const [selectedSize, setSelectedSize] = useState<keyof typeof sizeDetails>('7 ft')
  const [selectedLight, setSelectedLight] = useState<keyof typeof lightDetails>('Light Filtering')

  const bestSellers = [...products].sort((a, b) => (a.catalogue?.salesRank || 9999) - (b.catalogue?.salesRank || 9999)).slice(0, 4)
  const stripedProducts = products.filter((product) => product.catalogue?.attributes?.pattern?.toLowerCase().includes('strip')).slice(0, 3)
  const signatureProducts = stripedProducts.length ? stripedProducts : bestSellers.slice(0, 3)
  const hasBlackout = products.some((product) => product.catalogue?.attributes?.opacity?.toLowerCase().includes('blackout'))

  const currentSize = sizeDetails[selectedSize]
  const currentLight = lightDetails[selectedLight]

  return (
    <div className="curtain-home">
      {/* 1. Immersive Hero Section */}
      <section className="curtain-hero">
        <div className="curtain-hero__content">
          <Eyebrow>Premium Cotton Weaves</Eyebrow>
          <h1>Curtains That Transform <em>Everyday Homes</em></h1>
          <p>Explore light-filtering striped and solid curtains for windows and doors. Designed for effortless installation and cozy, warm spaces.</p>
          <div className="curtain-actions">
            <Link className="curtain-button curtain-button--primary" href={shopLink({ sort: 'best' })}>
              Shop Best Sellers <ArrowRight size={16} />
            </Link>
            <Link className="curtain-button curtain-button--outline" href="/shop">
              Shop All Curtains
            </Link>
          </div>
          <div className="curtain-hero__links">
            <Link className="curtain-inline-link" href="#interactive-size-visualizer">
              Find Your Curtain Size <Ruler size={14} />
            </Link>
            <span className="divider" />
            <Link className="curtain-inline-link" href="#light-control-guide">
              Light & Fabric Guide <Sun size={14} />
            </Link>
          </div>
        </div>
        <div className="curtain-hero__visual">
          <Image
            alt="Warm living room with curtains filtering daylight"
            fill
            priority
            sizes="(max-width: 767px) 100vw, 50vw"
            src={imagery.hero}
            className="curtain-hero__image"
          />
          <div className="curtain-hero__card">
            <div className="curtain-hero__card-num">01</div>
            <div>
              <h3>Soft daylight.</h3>
              <p>Considered drops for beautiful, comfortable everyday living.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sleek Trust Banner */}
      <section className="curtain-trust" aria-label="AlemAh quality promises">
        <div className="curtain-container">
          <div className="curtain-trust__grid">
            <div className="curtain-trust__item">
              <PackageCheck className="icon" />
              <div>
                <h4>Easy to Hang</h4>
                <p>Convenient header loops</p>
              </div>
            </div>
            <div className="curtain-trust__item">
              <Sun className="icon" />
              <div>
                <h4>Light Control</h4>
                <p>From soft to darkened drop</p>
              </div>
            </div>
            <div className="curtain-trust__item">
              <WashingMachine className="icon" />
              <div>
                <h4>Machine Washable</h4>
                <p>Practical everyday maintenance</p>
              </div>
            </div>
            <div className="curtain-trust__item">
              <Layers3 className="icon" />
              <div>
                <h4>Value Room Packs</h4>
                <p>Coordinated window/door sets</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Best Sellers Section */}
      <section className="curtain-section curtain-container">
        <SectionHeader
          eyebrow="Curated Favorites"
          title="Curtains Loved by Our Customers"
          copy="Discover the designs homeowners return to for soft cotton texture, effortless style, and everyday comfort."
          action={
            <Link className="curtain-inline-link" href={shopLink({ sort: 'best' })}>
              View all best sellers <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="curtain-best-sellers-layout">
          <div className="curtain-best-sellers-intro">
            <div className="intro-card">
              <span className="badge">Best Seller Collection</span>
              <h3>Perfect Fit. Premium Finish.</h3>
              <p>Each curtain is tailored with meticulous attention to stitch quality, drop fall, and functional dimensions.</p>
              <ul className="checklist">
                <li><Check size={14} /> Natural 100% Cotton fabric</li>
                <li><Check size={14} /> Ready-to-hang pre-fit loops</li>
                <li><Check size={14} /> Preshrunk to avoid shrinkage</li>
              </ul>
              <Link className="curtain-button" href="/shop">
                Browse All Curtains <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="curtain-best-sellers-grid">
            {bestSellers.length ? (
              <div className="curtain-products">
                {bestSellers.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <EmptyProducts />
            )}
          </div>
        </div>
      </section>

      {/* 4. Interactive Curtain Size & Drop Visualizer */}
      <section className="curtain-section curtain-size-visualizer-section" id="interactive-size-visualizer">
        <div className="curtain-container">
          <SectionHeader
            eyebrow="Interactive Fitting Tool"
            title="Visualize the Perfect Length"
            copy="Find the right ready-made length for your home. Click a size to simulate how it hangs relative to standard frames."
          />
          <div className="visualizer-container">
            <div className="visualizer-controls">
              <h3>Select a Curtain Length</h3>
              <p className="controls-lead">Choose a length to check fit guidelines, drop dimensions, and placement advice.</p>
              <div className="size-selector-grid">
                {(Object.keys(sizeDetails) as Array<keyof typeof sizeDetails>).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`size-selector-btn ${selectedSize === size ? 'active' : ''}`}
                  >
                    <span className="btn-size-label">{size}</span>
                    <span className="btn-size-sub">{size === '9 ft+' ? 'Extra Long' : sizeDetails[size].type}</span>
                  </button>
                ))}
              </div>

              <div className="size-info-card">
                <div className="info-title">
                  <Ruler size={18} className="text-brand" />
                  <h4>{currentSize.name}</h4>
                </div>
                <div className="info-details">
                  <div className="detail-row">
                    <span className="label">Ready Drop:</span>
                    <span className="value">{currentSize.drop}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Best For:</span>
                    <span className="value">{currentSize.bestFor}</span>
                  </div>
                  <div className="detail-row info-tip">
                    <Info size={14} />
                    <p>{currentSize.tip}</p>
                  </div>
                </div>
                <Link className="size-cta-link" href={shopLink({ size: selectedSize })}>
                  Explore {selectedSize} Curtains <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="visualizer-preview">
              <div className="simulator-room">
                {/* Wall Background */}
                <div className="simulator-wall">
                  <div className="ceiling-line"><span>Ceiling</span></div>
                  
                  {/* Window/Door Frame */}
                  <div className={`simulator-frame frame--${currentSize.type}`}>
                    <span className="frame-label">{currentSize.type === 'window' ? 'Window Frame' : 'Door Frame'}</span>
                  </div>

                  {/* Curtain Rod */}
                  <div className="simulator-rod" />

                  {/* Curtain Mesh */}
                  <div className="simulator-curtain-container">
                    <div 
                      className="simulator-curtain" 
                      style={{ height: currentSize.visualHeight }}
                    >
                      <div className="curtain-folds">
                        <span /><span /><span /><span /><span /><span />
                      </div>
                      <div className="curtain-ready-label">{currentSize.drop}</div>
                    </div>
                  </div>

                  <div className="floor-line"><span>Floor</span></div>
                </div>
              </div>
              <div className="preview-caption">
                <p>Interactive scale representation (wall height normalized to 9.5 ft ceiling).</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Shop by Category Section */}
      <section className="curtain-section curtain-container curtain-section--category">
        <SectionHeader
          eyebrow="Browse with ease"
          title="Explore Collections by Style"
          copy="Whether you seek light stripes or clean, solid colors, select a category below to filter our weave catalog."
        />
        <div className="curtain-categories-masonry">
          {categories.map((category, index) => (
            <Link
              className={`category-masonry-card card--${index + 1}`}
              href={category.href}
              key={category.title}
            >
              <div className="image-wrapper">
                <Image
                  alt={category.title}
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                  src={category.image}
                  className="category-image"
                />
              </div>
              <div className="card-overlay" />
              <div className="card-content">
                <span className="card-num">0{index + 1}</span>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <span className="card-cta">
                  Explore Collection <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Interactive Light Control & Fabric Guide */}
      <section className="curtain-section curtain-light-guide-section" id="light-control-guide">
        <div className="curtain-container">
          <SectionHeader
            eyebrow="Fabric & Light Control"
            title="Choose the Light Level for Your Space"
            copy="Understand how our different weaves filter incoming daylight to craft the ideal mood for each room."
          />
          <div className="light-guide-layout">
            <div className="light-guide-preview">
              <div className="window-simulator-box">
                {/* Simulated sunny view background */}
                <div className="simulated-scenery">
                  <div className="simulated-sun" />
                  <div className="simulated-landscape" />
                </div>
                {/* Simulated light filtration overlay */}
                <div 
                  className="simulated-light-filter" 
                  style={{ backgroundColor: currentLight.overlayBg }}
                />
                {/* Window pane lines */}
                <div className="window-panes">
                  <span className="vertical-pane" />
                  <span className="horizontal-pane" />
                </div>
                {/* Text indicator overlay */}
                <div className="light-intensity-badge">
                  <span>{currentLight.intensity}</span>
                </div>
              </div>
              <div className="light-preview-caption">
                <p>Simulated room light level with <strong>{currentLight.name}</strong> curtains closed.</p>
              </div>
            </div>

            <div className="light-guide-content">
              <div className="light-tabs">
                {(Object.keys(lightDetails) as Array<keyof typeof lightDetails>).map((lightKey) => {
                  if (lightKey === 'Blackout' && !hasBlackout) return null
                  return (
                    <button
                      key={lightKey}
                      onClick={() => setSelectedLight(lightKey)}
                      className={`light-tab-btn ${selectedLight === lightKey ? 'active' : ''}`}
                    >
                      {lightKey}
                    </button>
                  )
                })}
              </div>

              <div className="light-info">
                <h3>{currentLight.name} Weave</h3>
                <p className="light-desc">{currentLight.description}</p>
                
                <div className="light-spec-grid">
                  <div className="spec-item">
                    <h5>Best Suited For:</h5>
                    <p>{currentLight.ideal}</p>
                  </div>
                  <div className="spec-item">
                    <h5>Fabric Construction:</h5>
                    <p>{currentLight.fabric}</p>
                  </div>
                </div>

                <div className="light-cta-block">
                  <Link className="curtain-button" href={shopLink({ light: selectedLight.toLowerCase() })}>
                    Shop {currentLight.name} Curtains <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Designer Color Palette Grid */}
      <section className="curtain-section curtain-container curtain-colours-section">
        <SectionHeader
          eyebrow="Color, Considered"
          title="Browse by Palette"
          copy="Select a custom dyed tone to complement your room's wall paint and decor style."
        />
        <div className="colours-swatch-ring">
          {curtainColors.map((color) => (
            <Link
              aria-label={`Shop ${color.name} curtains`}
              href={shopLink({ color: color.name })}
              key={color.name}
              className="colour-swatch-card"
            >
              <div className="swatch-circle-wrapper">
                <i className="swatch-circle" style={{ background: color.value }} />
              </div>
              <span className="swatch-name">{color.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. Editorial Showcase: Signature Stripes */}
      <section className="curtain-section signature-stripes-section">
        <div className="curtain-container">
          <div className="signature-layout">
            <div className="signature-editorial">
              <div className="editorial-media">
                <Image
                  alt="Striped curtain fabric in a warm, styled room"
                  fill
                  sizes="(max-width: 767px) 100vw, 50vw"
                  src={imagery.editorial}
                  className="editorial-image"
                />
              </div>
              <div className="editorial-content">
                <Eyebrow>AlemAh Signature Weave</Eyebrow>
                <h2>Our Classic Stripes</h2>
                <p>Balanced colors, organic cotton textures, and versatile stripe spacing created to bring architectural rhythm to your space without overpowering it.</p>
                <Link className="curtain-button curtain-button--light" href={shopLink({ pattern: 'striped' })}>
                  Explore Striped Curtains <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            
            <div className="signature-products-panel">
              <div className="signature-panel-header">
                <h3>Signature Stripes Items</h3>
                <p>Popular choices from this collection</p>
              </div>
              <div className="curtain-products curtain-products--three">
                {signatureProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Styled in Real Homes (Social Proof Carousel/Grid) */}
      <section className="curtain-section curtain-real-homes-section">
        <div className="curtain-container">
          <SectionHeader
            eyebrow="Spotted in Real Spaces"
            title="Home Inspiration"
            copy="See how homeowners are styling AlemAh curtains in their actual living spaces."
          />
          <div className="real-homes-layout">
            <div className="real-homes-gallery">
              <div className="gallery-grid">
                <div className="gallery-item-placeholder item-large">
                  <Image 
                    alt="Living room setup with soft striped curtains" 
                    fill 
                    sizes="33vw" 
                    src={imagery.window} 
                    className="gallery-img"
                  />
                  <div className="gallery-tag">@house_of_stripes</div>
                </div>
                <div className="gallery-item-placeholder">
                  <Image 
                    alt="Door curtains in dining room" 
                    fill 
                    sizes="20vw" 
                    src={imagery.door} 
                    className="gallery-img"
                  />
                  <div className="gallery-tag">@cozy_corner</div>
                </div>
                <div className="gallery-item-placeholder">
                  <Image 
                    alt="Bedroom with room darkening curtains" 
                    fill 
                    sizes="20vw" 
                    src={imagery.stripe} 
                    className="gallery-img"
                  />
                  <div className="gallery-tag">@minimalist_abode</div>
                </div>
              </div>
            </div>
            
            <div className="real-homes-testimonials">
              <div className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">
                  {"\"The quality of the cotton is amazing. It allows just the right amount of light to filter in during the afternoon, and the tab loops made hanging them so easy. Will definitely order for the bedrooms next!\""}
                </p>
                <div className="testimonial-author">
                  <strong>Priya Sharma</strong>
                  <span>Verified Buyer · Delhi</span>
                </div>
              </div>
              <div className="testimonial-disclaimer">
                <Sparkles size={16} />
                <p>We do not compile fictional reviews. All stories reflect authentic customer feedback.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Value Packs Promotion */}
      <section className="curtain-value-banner-section">
        <div className="curtain-container">
          <div className="value-banner-inner">
            <div className="value-banner-content">
              <Eyebrow>Coordinated Value Packs</Eyebrow>
              <h2>Complete the Room with Multi-Packs</h2>
              <p>Explore matching window and door curtain configurations, packed together at a value price to easily unify your interior theme.</p>
            </div>
            <div className="value-banner-action">
              <Link className="curtain-button" href={shopLink({ pack: '2' })}>
                Shop Value Packs <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FAQ Accordion */}
      <section className="curtain-section curtain-container FAQ-section">
        <SectionHeader
          eyebrow="Help & Support"
          title="Frequently Asked Questions"
          action={
            <Link className="curtain-inline-link" href="/faq">
              View all help topics <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="faq-layout">
          <div className="faq-grid">
            {faqs.map(([question, answer]) => (
              <details className="faq-details" key={question}>
                <summary className="faq-summary">
                  <span>{question}</span>
                  <ChevronDown size={18} className="faq-icon" />
                </summary>
                <div className="faq-content">
                  <p>{answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 12. Final Call-to-Action */}
      <section className="curtain-final-section">
        <div className="curtain-final-bg-pattern textile-pattern" />
        <div className="curtain-container">
          <div className="final-cta-content">
            <Eyebrow>Refresh Your Living Spaces</Eyebrow>
            <h2>Ready to Elevate Your Home?</h2>
            <p>Explore premium curtains designed to bring softness, color, and cozy comfort into your everyday life.</p>
            <div className="curtain-actions">
              <Link className="curtain-button curtain-button--primary" href="/shop">
                Shop All Curtains <ArrowRight size={16} />
              </Link>
              <Link className="curtain-button curtain-button--outline" href={shopLink({ sort: 'best' })}>
                View Best Sellers
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function EmptyProducts() {
  return (
    <div className="curtain-empty">
      <Sparkles size={24} />
      <p>Our best sellers will appear as soon as products are published in the catalog.</p>
      <Link href="/shop" className="curtain-inline-link">
        Browse all curtains <ArrowRight size={14} />
      </Link>
    </div>
  )
}
