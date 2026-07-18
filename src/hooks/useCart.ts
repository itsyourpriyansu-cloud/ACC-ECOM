'use client'

import { useEffect, useState } from 'react'
import { useCartStore, CartItem } from '@/store/useCartStore'

export function useCart() {
  const items = useCartStore((state) => state.items)
  const addToCart = useCartStore((state) => state.addToCart)
  const removeFromCart = useCartStore((state) => state.removeFromCart)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)

  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    queueMicrotask(() => setHydrated(true))
  }, [])

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)

  const FREE_SHIPPING_THRESHOLD = 1500
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 150
  const totalAmount = subtotal + shippingCost
  const freeShippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)

  return {
    items: hydrated ? items : [],
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    totalItems,
    shippingCost,
    totalAmount,
    freeShippingProgress,
    hydrated,
  }
}

export type { CartItem }
