'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { SafeUser } from '@/lib/auth/types'

type AuthContext = {
  create: (args: {
    acceptedTerms: boolean
    email: string
    firstName: string
    lastName?: string
    password: string
    passwordConfirm: string
  }) => Promise<{ redirectTo?: string }>
  forgotPassword: (args: { email: string }) => Promise<void>
  login: (args: { email: string; password: string; returnTo?: string }) => Promise<SafeUser>
  logout: () => Promise<void>
  resetPassword: (args: {
    password: string
    passwordConfirm: string
    token: string
  }) => Promise<void>
  setUser: (user: SafeUser | null) => void
  status: 'loggedIn' | 'loggedOut' | undefined
  user?: null | SafeUser
}

type APIResponse = {
  code?: string
  fieldErrors?: Record<string, string[]>
  message?: string
  redirectTo?: string
  success?: boolean
  user?: null | SafeUser
}

const Context = createContext({} as AuthContext)

const request = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const result = (await response.json().catch(() => ({}))) as APIResponse
  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'The request could not be completed.')
  }
  return result
}

export const AuthProvider: React.FC<{
  children: React.ReactNode
  initialUser?: null | SafeUser
}> = ({ children, initialUser }) => {
  const [user, setUser] = useState<null | SafeUser | undefined>(initialUser)
  const [status, setStatus] = useState<'loggedIn' | 'loggedOut' | undefined>(
    initialUser ? 'loggedIn' : initialUser === null ? 'loggedOut' : undefined,
  )

  const create = useCallback<AuthContext['create']>(async (args) => {
    const result = await request('/api/auth/signup', {
      body: JSON.stringify(args),
      method: 'POST',
    })
    setUser(null)
    setStatus('loggedOut')
    return { redirectTo: result.redirectTo }
  }, [])

  const login = useCallback<AuthContext['login']>(async (args) => {
    const result = await request('/api/auth/login', {
      body: JSON.stringify(args),
      method: 'POST',
    })
    if (!result.user) throw new Error('The session could not be established.')
    setUser(result.user)
    setStatus('loggedIn')
    return result.user
  }, [])

  const logout = useCallback<AuthContext['logout']>(async () => {
    await request('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setStatus('loggedOut')
  }, [])

  const forgotPassword = useCallback<AuthContext['forgotPassword']>(async (args) => {
    await request('/api/auth/forgot-password', {
      body: JSON.stringify(args),
      method: 'POST',
    })
  }, [])

  const resetPassword = useCallback<AuthContext['resetPassword']>(async (args) => {
    await request('/api/auth/reset-password', {
      body: JSON.stringify(args),
      method: 'POST',
    })
    setUser(null)
    setStatus('loggedOut')
  }, [])

  useEffect(() => {
    if (initialUser !== undefined) return
    void request('/api/auth/session')
      .then((result) => {
        setUser(result.user || null)
        setStatus(result.user ? 'loggedIn' : 'loggedOut')
      })
      .catch(() => {
        setUser(null)
        setStatus('loggedOut')
      })
  }, [initialUser])

  return (
    <Context.Provider
      value={{
        create,
        forgotPassword,
        login,
        logout,
        resetPassword,
        setUser,
        status,
        user,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useAuth = () => useContext(Context)
