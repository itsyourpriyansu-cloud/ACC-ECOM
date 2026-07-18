# Alemah Ecommerce — Design & Build Record

> Working document — updated 13 July 2026. This records what is built in the current workspace, the design decisions behind it, and the work required before public launch. It deliberately contains no passwords, API keys, database URLs, or payment credentials.

## 1. Product vision

Alemah is a warm, modern Indian home-textile store, beginning with curtains. The experience should make choosing curtains feel less technical and more room-led: customers begin with the feeling, light level, room and fit they want, then discover the right product.

The visual direction is editorial, tactile and calm rather than a dense marketplace. The intended reference point is the spacious, image-led interaction model discussed for Pifi, adapted to a curtain-first Indian audience.

### Primary customer promises

- Help customers choose light, privacy, fabric and size with confidence.
- Make the product detail clear before checkout: what it is, where it works, what is included and what it costs.
- Keep checkout short, trustworthy and mobile-first.
- Give returning customers one place for their orders, addresses and saved products.

## 2. Current architecture

```text
Customer browser
  └─ Next.js 15 storefront + Payload Admin
       ├─ Payload CMS collections and ecommerce plugin
       ├─ PostgreSQL (Supabase connection)
       ├─ Cloudinary / stock-image URLs for media delivery
       ├─ Google OAuth + email/password customer sign-in
       ├─ PhonePe payment adapter (credentials still required)
       ├─ Shiprocket fulfilment adapter (credentials still required)
       └─ Vercel deployment target
```

Payload is the operational CMS: products, categories, pages, media, customers and commerce records are managed there. The custom Next.js storefront is the customer-facing design layer.

## 3. Information architecture

### Storefront routes

| Area | Route | Current experience |
|---|---|---|
| Home | `/` | Conversion-focused curtain landing page with video, room stories, fit finder, FAQs and CTAs. |
| Shop | `/shop` | Curtain catalogue with search plus room, light/privacy and fabric filters. |
| Product | `/products/[slug]` | Curtain-first product page with key facts, benefits, FAQs, price, cart and save controls. |
| Cart | drawer | Persistent cart drawer with quantity editing and checkout entry. |
| Checkout | `/checkout` | Address, customer details and PhonePe checkout path. |
| Payment return | `/checkout/phonepe/return` | Confirms the PhonePe result and completes the order flow. |
| Account | `/account` | Profile, recent orders and saved products. |
| Orders | `/orders`, `/orders/[id]` | Customer order history and order detail. |
| Addresses | `/account/addresses` | Saved delivery addresses. |
| Login | `/login`, `/create-account`, `/forgot-password` | Email/password accounts, reset flow and optional Google sign-in. |
| Help & legal | `/faq`, `/privacy`, `/terms` | Starter support and legal pages; final legal text is still needed. |

### Admin routes

Payload Admin lives under `/admin`. It is the source of truth for the catalogue, media, customer records, orders and operational fulfilment details.

## 4. Design system

### Palette

The custom curtain surfaces use a warm editorial palette:

| Token | Value | Role |
|---|---:|---|
| Ink | `#512125` | Main text, dark brand surface |
| Wine | `#9D3233` | Primary action, active state, emphasis |
| Clay | `#D75A4D` | Accent and detail markers |
| Canvas | `#FFFDFA` | Main page background |
| Cream | `#F6EBBD` | Warm fit-finder / information highlight |
| Sand | `#F7F1E8` | Soft content panels |
| Muted text | `#765B5B` | Supporting copy |
| Divider | `rgba(81,33,37,.16)` | Borders and quiet separation |

### Typography

- **Cabinet Grotesk**: display headings, large product titles and editorial emphasis.
- **Satoshi**: navigation, labels, form text and compact UI copy.
- Headings use tight tracking, large scale and short line lengths; supporting copy remains calm and readable.

### Interaction language

- Pill-shaped primary actions and filters.
- Understated borders rather than heavy cards or shadows.
- Image hover zoom and directional-arrow movement on desktop.
- GSAP reveal transitions and Lenis smooth scrolling on the landing page.
- Motion is disabled when the visitor prefers reduced motion.
- Lucide icons provide consistent utility and assurance iconography.

## 5. Homepage experience

The landing page is implemented in `src/components/home/AlemahHome.tsx`.

1. **Announcement strip** — free-shipping, returns and Indian-home message.
2. **Video hero** — editorial split layout, direct shop CTA and fit-finder CTA.
3. **Value statement** — “better mood, better rest” framing with practical confidence points.
4. **Shop by need** — window curtains, door curtains and sheers/layers.
5. **Why Alemah** — fabric movement, light control and service reassurance.
6. **Shop the room** — interactive room imagery with clickable product hotspots and changing product detail panel.
7. **Curtain fit finder** — a lightweight calculator that recommends total curtain width at twice the entered window width.
8. **Four-step decision journey** — room → feeling → fall → delivery.
9. **Benefit-led social proof** — light, blackout and sizing confidence messages.
10. **Expandable FAQs** — size, light, installation and return questions.
11. **Final visual CTA** — returns the customer to the curtain catalogue.

The current hero video and room imagery are stock assets. They should be replaced with licensed Alemah product/room photography before public launch.

## 6. Catalogue and product design

### Catalogue

`CurtainCatalogue` turns Payload product information into a focused browse experience.

- Text search across product names.
- Client-side filters for **room**, **light & privacy** and **fabric**.
- Responsive filter drawer on mobile.
- Three-column desktop grid and two-column mobile grid.
- Product cards show opacity, curtain type, colour, price and ready-to-hang/size information.
- A helpful empty state lets the customer reset filters.

### Product page

`CurtainProductPage` gives each curtain a retail-ready story:

- Sticky product image on desktop; standard in-flow image on mobile.
- Curtain type and colour, price, selectable variants, stock information and add-to-cart action.
- Save-to-wishlist action for signed-in customers.
- At-a-glance facts: fabric, opacity, colour, recommended room, header/installation and panel count when present.
- Measurement guidance linking to the fit finder.
- Product highlights and FAQs supplied from Payload.
- Delivery/support reassurance markers.

## 7. Mobile and accessibility direction

- The storefront layouts collapse deliberately at the mobile breakpoint instead of merely shrinking desktop columns.
- The mobile tab bar provides quick access to Home, Shop, Cart, Wishlist/Account.
- Catalogue filters become a visible mobile control.
- Buttons use labels and icon actions provide accessible names.
- Interactive room hotspots, filter controls and accordion items are keyboard-accessible native controls.
- The homepage respects `prefers-reduced-motion`.

### Still required

The UI is responsive, but an installable PWA layer is not yet complete. A web app manifest, icons, service-worker caching policy and real-device installation test are required before describing it as a complete PWA.

## 8. CMS and data model

### Payload-managed content

| Collection | Purpose |
|---|---|
| Products | Price, variants, catalogue facts, stock, highlights, FAQs and visuals. |
| Categories | Product grouping and navigation. |
| Media | Managed media assets. |
| Pages | Editable CMS pages. |
| Users | Admin and customer identities, addresses, carts and order relationships. |
| Wishlists | Per-customer saved product records. |
| Orders / transactions / carts | Provided and extended through the ecommerce integration. |

### Curtain listing model

The imported curtain records support the retail information used in the design: curtain type, fabric, opacity, colour, room recommendation, size, installation/header, pack information, highlights, FAQs and visual metadata. Thirty demo curtain products are currently published for testing.

### Admin workflow

1. Add or edit product information in Payload Admin.
2. Upload/attach final product images and replace preview stock-image URLs.
3. Maintain price, variants and inventory.
4. Review incoming orders and payment state.
5. Enter/confirm Shiprocket fulfilment information and dispatch orders.
6. Review customers, their addresses, order history and wishlists where operationally appropriate.

## 9. Customer identity and saved products

### Built now

- Email/password registration, sign-in, logout and password reset.
- Email-first account choice: an existing email is routed to prefilled sign-in; a new email continues to name/password sign-up.
- Customer-scoped carts, addresses, orders and wishlists.
- Wishlist save/remove control on product pages.
- Saved-product section in the customer account area.
- User fields for `phoneNumber`, `phoneVerifiedAt` and `googleSubject`.
- Google OAuth authorization and callback routes; a verified Google email creates or links a customer profile and establishes a secure Payload session.

### Important behaviour

Customer data is protected by ownership access checks. A signed-in customer can only read or change their own wishlist records and related account data. The wishlist database schema and Payload relation support are migrated.

### Not yet live

- SMS/phone OTP requires a real SMS provider and anti-abuse controls; it is not yet enabled.
- Google sign-in needs the production domain added as an authorized callback URL before launch.
- Email delivery needs a real SMTP provider for dependable password resets and order emails.

## 10. Checkout, payment and shipping

### Checkout and order state

- A customer may checkout with their delivery/billing address.
- Guest cart data is synchronized to the customer after sign-in.
- Test orders have been created and confirmed during sanity checks.

### PhonePe

The PhonePe adapter, checkout initiation, return page and transaction fields are implemented. It is deliberately disabled unless the public enable flag is set and the correct modern PhonePe OAuth credentials are supplied.

Before accepting real money, the production configuration must include the valid merchant credentials, return/callback domain and a verified webhook signature flow. Payment confirmation must remain idempotent so an order cannot be duplicated by a retry.

### Shiprocket

The admin order model contains Shiprocket shipment/order/AWB/courier fields and an explicit send-to-Shiprocket action. The integration validates required delivery data before creating a shipment.

It needs a real Shiprocket account, pickup location and credential test before production dispatches are enabled.

## 11. Deployment and operations design

### Recommended target

- **Preview:** Vercel preview deployment for device and performance testing.
- **Production:** Vercel Pro for a commercial store, with Functions placed near the database.
- **Database:** Managed PostgreSQL/Supabase using the transaction pooler and applied Payload migrations.
- **Media:** Cloudinary or equivalent image CDN once final product photography is provided.
- **Edge protection:** Vercel CDN by default; Cloudflare can be added for DNS, DDoS and basic bot protection after end-to-end testing.

### Environment configuration

Secrets belong only in local ignored environment files and Vercel environment variables. Required categories are:

- Payload secret and production URLs.
- PostgreSQL connection URL and pool limit.
- SMTP provider configuration.
- Google OAuth client configuration.
- PhonePe configuration.
- Shiprocket configuration.
- Cloudinary configuration.

No secret belongs in Git, browser JavaScript, documentation or public CMS content.

### Caching rule

Public catalogue/product pages and image assets can be cached. Never cache authenticated account routes, `/api`, `/admin`, login/callback routes, checkout, payment returns or payment/shipping webhooks in a shared CDN cache.

## 12. Security baseline before launch

The production checklist must include:

- Upgrade Next.js, React, Payload and payment dependencies to current patched releases.
- Rotate credentials that were ever placed in a chat, screenshot, commit or log.
- Use secure, HTTP-only, same-site session cookies on the live HTTPS domain.
- Enforce rate limits on login, password reset, OTP, checkout and webhook endpoints.
- Require multi-factor authentication for Payload administrators and use least-privilege admin access.
- Use CSP, security headers, strict CORS, CSRF protection and server-side input validation.
- Verify PhonePe webhook signatures and restrict Shiprocket/webhook inputs.
- Store no payment card data; use the payment provider’s hosted payment flow.
- Configure database backups, recovery testing, error monitoring, uptime monitoring and operational alerts.
- Review Cloudflare/Vercel bot and DDoS settings without challenging legitimate payment/shipping webhooks.

## 13. Delivery status

| Status | Scope |
|---|---|
| Built and tested | Custom home, catalogue, product, cart, account, orders, addresses, wishlist, email/password auth, Google OAuth handoff, data migrations and demo product catalogue. |
| Implemented but waiting on real provider data | PhonePe, Shiprocket, SMTP email, Cloudinary final media and production Google redirect domain. |
| Still required for launch | Final product imagery/content, legal copy, OTP decision/provider, production payment and shipping tests, PWA completion, performance testing on deployed domain, security hardening, backups/monitoring and full launch QA. |

## 14. Useful file map

| File / area | Responsibility |
|---|---|
| `src/components/home/AlemahHome.tsx` | Homepage sections, room hotspots, fit finder, GSAP/Lenis motion. |
| `src/components/home/alemah-home.css` | Homepage visual system and responsive rules. |
| `src/components/catalogue/CurtainCatalogue.tsx` | Catalogue search/filter UI. |
| `src/components/product/CurtainProductPage.tsx` | Curtain product-detail layout. |
| `src/components/wishlist/WishlistButton.tsx` | Save/remove customer wishlist interaction. |
| `src/collections/Wishlists/index.ts` | Wishlist access rules and CMS collection. |
| `src/collections/Users/index.ts` | Customer/admin identity, account joins and OAuth/phone fields. |
| `src/app/(app)/auth/google/*` | Google OAuth start and callback routes. |
| `src/app/(app)/auth/email/continue/route.ts` | Rate-limited email-first account decision route. |
| `src/payments/phonepe/index.ts` | PhonePe adapter. |
| `src/shipping/shiprocket.ts` | Shiprocket fulfilment adapter. |
| `src/collections/Orders/index.ts` | Order fields and Shiprocket dispatch control. |
| `src/migrations/` | Versioned database changes; apply through Payload migrations only. |
| `.env.example` | Safe list of required environment-variable names. |

## 15. Baymard-informed storefront and PWA pass (July 2026)

The storefront has been refined around the supplied product, cart, checkout, account, search and order-flow references. This is a pattern implementation, not a copy of any retailer’s branded interface.

- Removed the overused glass treatment in favour of solid warm surfaces, clear borders and reliable contrast.
- Added PWA manifest, service-worker registration, offline fallback, safe-area spacing and a mobile bottom navigation that does not cover checkout/account actions.
- Added product size-and-fit guidance from the Payload product attributes, plus direct **Buy now** and add-to-bag flows.
- Added cart delivery-threshold feedback, a clear cart drawer confirmation and a concise checkout progress state.
- Reworked guest versus returning-customer checkout choices, delivery collection, PhonePe handoff messaging and sticky desktop order review.
- Added catalogue query support, inline product suggestions and a useful no-results recovery state.
- Reworked the account dashboard and orders empty state for small screens and touch use.

The PWA intentionally bypasses cache handling for account, auth, checkout, admin, orders and all API routes. Only safe public assets are cache-first; navigations fall back to the offline page if the network is unavailable.

## 16. Immediate next sequence

1. Deploy a protected Vercel preview and test it on real Android/iPhone devices.
2. Replace stock assets with real Alemah photography and verify all product data in Payload.
3. Add the live domain, SSL, Google OAuth callback and Vercel production environment variables.
4. Configure and test SMTP, PhonePe and Shiprocket sandbox/live flows one at a time.
5. Test PWA installation, offline recovery and touch interactions on a real Android and iPhone from the deployed HTTPS domain.
6. Conduct a complete customer/admin production checklist before opening checkout to customers.
