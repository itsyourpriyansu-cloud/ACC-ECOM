import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface UIState {
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  authOpen: boolean
  setAuthOpen: (open: boolean) => void
  filterOpen: boolean
  setFilterOpen: (open: boolean) => void
  toasts: Toast[]
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
  authOpen: false,
  setAuthOpen: (open) => set({ authOpen: open }),
  filterOpen: false,
  setFilterOpen: (open) => set({ filterOpen: open }),
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 4000)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export type { Toast }
