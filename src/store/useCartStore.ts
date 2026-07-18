import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  variantId: string
  productId: string
  name: string
  image: string
  size: string
  color: string
  price: number
  quantity: number
  stock: number
}

interface CartState {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addToCart: (newItem) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === newItem.variantId)
          if (existing) {
            const newQty = Math.min(existing.quantity + newItem.quantity, newItem.stock)
            return {
              items: state.items.map((i) =>
                i.variantId === newItem.variantId ? { ...i, quantity: newQty } : i,
              ),
            }
          }
          return { items: [...state.items, newItem] }
        }),
      removeFromCart: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'alemah-cart-storage',
    },
  ),
)
