'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useUIStore } from '@/store/useUIStore'
import { useAuth } from '@/providers/Auth'
import { useEffect, useRef, useState } from 'react'
import { curtainColors, curtainMenu, guideMenu, shopLink, shopMenuGroups } from '@/components/storefront-config'

type MenuName = 'shop' | 'curtains' | 'colors' | 'guides' | null

const mainLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', menu: 'shop' as const },
  { label: 'Curtains', menu: 'curtains' as const },
  { label: 'Best Sellers', href: shopLink({ sort: 'best' }) },
  { label: 'Colors', menu: 'colors' as const },
  { label: 'Deals', href: shopLink({ pack: '2' }) },
  { label: 'Guides', menu: 'guides' as const },
]

export default function Header() {
  const { user } = useAuth()
  const { cart } = useCart()
  const totalItems = cart?.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0
  const setCartOpen = useUIStore((state) => state.setCartOpen)
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<MenuName>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMobileOpen(false); setOpenMenu(null) }, [pathname])
  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
      if (event.key !== 'Tab' || !drawerRef.current) return
      const items = drawerRef.current.querySelectorAll<HTMLElement>('a, button:not([disabled])')
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    window.setTimeout(() => drawerRef.current?.querySelector<HTMLElement>('button, a')?.focus(), 0)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown) }
  }, [mobileOpen])

  const dropdown = (menu: Exclude<MenuName, null>) => {
    if (menu === 'shop') return <div className="alemah-mega-menu">{shopMenuGroups.map((group) => <div key={group.title}><p>{group.title}</p>{group.links.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}</div>)}</div>
    if (menu === 'colors') return <div className="alemah-dropdown alemah-colour-menu"><p>Shop by color</p>{curtainColors.map((color) => <Link href={shopLink({ color: color.name })} key={color.name}><i style={{ background: color.value }} />{color.name}</Link>)}</div>
    const entries = menu === 'curtains' ? curtainMenu : guideMenu
    return <div className="alemah-dropdown">{entries.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}</div>
  }

  return <>
    <div className="alemah-announcement" role="status">Free shipping on orders above ₹999</div>
    <header className="alemah-header">
      <div className="alemah-header__inner">
        <button aria-controls="alemah-mobile-drawer" aria-expanded={mobileOpen} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} className="alemah-icon-button md:hidden" onClick={() => setMobileOpen((value) => !value)} type="button">{mobileOpen ? <X /> : <Menu />}</button>
        <Link href="/" className="alemah-wordmark" aria-label="Alemah home">ALEMAH</Link>
        <nav className="alemah-desktop-nav" aria-label="Primary navigation">
          {mainLinks.map((item) => item.menu ? <div className="alemah-nav-menu" key={item.label} onMouseLeave={() => setOpenMenu(null)}>
            <button aria-expanded={openMenu === item.menu} onClick={() => setOpenMenu(openMenu === item.menu ? null : item.menu)} onMouseEnter={() => setOpenMenu(item.menu)}>{item.label}<ChevronDown size={14} /></button>
            {openMenu === item.menu ? dropdown(item.menu) : null}
          </div> : <Link className={pathname === item.href ? 'is-active' : ''} href={item.href} key={item.label}>{item.label}</Link>)}
        </nav>
        <div className="alemah-header-actions">
          <Link aria-label="Search curtains" href="/shop"><Search /></Link>
          <Link aria-label="My account" href={user ? '/account' : '/login'}><User /><span className="hidden xl:inline">Account</span></Link>
          <Link className="alemah-track-link" href="/find-order">Track Order</Link>
          <button aria-label={`Cart${totalItems ? `, ${totalItems} items` : ''}`} onClick={() => setCartOpen(true)} type="button"><ShoppingBag />{totalItems > 0 ? <b aria-live="polite">{totalItems}</b> : null}</button>
        </div>
      </div>
    </header>
    {mobileOpen ? <div className="alemah-drawer-layer md:hidden" onMouseDown={() => setMobileOpen(false)}><div id="alemah-mobile-drawer" ref={drawerRef} className="alemah-mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu" onMouseDown={(event) => event.stopPropagation()}>
      <div className="alemah-drawer-top"><span>Explore Alemah</span><button aria-label="Close menu" onClick={() => setMobileOpen(false)} type="button"><X /></button></div>
      <nav aria-label="Mobile navigation">
        <Link href="/">Home<ChevronRight /></Link>
        <DrawerGroup title="Shop" groups={shopMenuGroups} />
        <DrawerGroup title="Curtains" links={curtainMenu} />
        <Link href={shopLink({ sort: 'best' })}>Best Sellers<ChevronRight /></Link>
        <DrawerGroup title="Colors" links={curtainColors.map((color) => [color.name, shopLink({ color: color.name })] as const)} />
        <Link href={shopLink({ pack: '2' })}>Deals<ChevronRight /></Link>
        <DrawerGroup title="Guides" links={guideMenu} />
        <Link href="/find-order">Track Order<ChevronRight /></Link>
        <Link href={user ? '/account' : '/login'}>{user ? 'Account' : 'Sign in'}<ChevronRight /></Link>
      </nav>
    </div></div> : null}
  </>
}

function DrawerGroup({ title, links, groups }: { title: string; links?: readonly (readonly [string, string])[]; groups?: typeof shopMenuGroups }) {
  return <details><summary>{title}<ChevronDown /></summary><div>{groups?.map((group) => <section key={group.title}><p>{group.title}</p>{group.links.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}</section>)}{links?.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}</div></details>
}
