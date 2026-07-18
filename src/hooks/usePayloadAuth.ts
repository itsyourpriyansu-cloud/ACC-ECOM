'use client'

import { useEffect, useState } from 'react'

export interface PayloadUser {
  id: string
  email: string
  name?: string
  phone?: string
  role?: string
}

export function usePayloadAuth() {
  const [user, setUser] = useState<PayloadUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data?.user ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (res.ok && data.user) {
      setUser(data.user)
      return { success: true }
    }
    return { success: false, error: data.errors?.[0]?.message || 'Login failed' }
  }

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, phone }),
    })
    const data = await res.json()
    if (res.ok && data.doc) {
      // Auto-login after registration
      return login(email, password)
    }
    return { success: false, error: data.errors?.[0]?.message || 'Registration failed' }
  }

  const logout = async () => {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }

  return { user, loading, login, register, logout }
}
