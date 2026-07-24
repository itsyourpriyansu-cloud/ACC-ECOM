'use client'

import type { User } from '@/payload-types'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type ResetPassword = (args: {
  password: string
  passwordConfirm: string
  token: string
}) => Promise<void>

type ForgotPassword = (args: { email: string }) => Promise<void>

type Create = (args: { email: string; password: string; passwordConfirm: string }) => Promise<void>

type Login = (args: { email: string; password: string }) => Promise<User>

type Logout = () => Promise<void>

type AuthContext = {
  create: Create
  forgotPassword: ForgotPassword
  login: Login
  logout: Logout
  resetPassword: ResetPassword
  setUser: (user: User | null) => void
  status: 'loggedIn' | 'loggedOut' | undefined
  user?: User | null
}

const Context = createContext({} as AuthContext)

type APIResponse = {
  doc?: User
  errors?: Array<{ message?: string }>
  message?: string
  user?: User | null
}

const readAPIResponse = async (response: Response): Promise<APIResponse> => {
  return (await response.json().catch(() => ({}))) as APIResponse
}

const getAPIError = (response: Response, result: APIResponse, fallback: string) =>
  new Error(result.errors?.[0]?.message || result.message || response.statusText || fallback)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>()

  // used to track the single event of logging in or logging out
  // useful for `useEffect` hooks that should only run once
  const [status, setStatus] = useState<'loggedIn' | 'loggedOut' | undefined>()
  const create = useCallback<Create>(async (args) => {
    try {
      const res = await fetch('/api/users', {
        body: JSON.stringify({
          email: args.email,
          password: args.password,
          passwordConfirm: args.passwordConfirm,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const result = await readAPIResponse(res)
      if (!res.ok || !result.doc) {
        throw getAPIError(res, result, 'Unable to create the account.')
      }

      const loginResponse = await fetch('/api/users/login', {
        body: JSON.stringify({ email: args.email, password: args.password }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const loginResult = await readAPIResponse(loginResponse)
      if (!loginResponse.ok || !loginResult.user) {
        throw getAPIError(loginResponse, loginResult, 'The account was created, but sign-in failed.')
      }

      setUser(loginResult.user)
      setStatus('loggedIn')
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unable to create the account.')
    }
  }, [])

  const login = useCallback<Login>(async (args) => {
    try {
      const res = await fetch('/api/users/login', {
        body: JSON.stringify({
          email: args.email,
          password: args.password,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const result = await readAPIResponse(res)
      if (res.ok && result.user) {
        setUser(result.user)
        setStatus('loggedIn')
        return result.user
      }

      throw getAPIError(res, result, 'Invalid email or password.')
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unable to sign in.')
    }
  }, [])

  const logout = useCallback<Logout>(async () => {
    try {
      const res = await fetch('/api/users/logout', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (res.ok) {
        setUser(null)
        setStatus('loggedOut')
      } else {
        throw new Error('Unable to sign out.')
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unable to sign out.')
    }
  }, [])

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/users/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET',
        })

        if (res.ok) {
          const { user: meUser } = await res.json()
          setUser(meUser || null)
          setStatus(meUser ? 'loggedIn' : 'loggedOut')
        } else {
          setUser(null)
          setStatus('loggedOut')
        }
      } catch {
        setUser(null)
        setStatus('loggedOut')
      }
    }

    void fetchMe()
  }, [])

  const forgotPassword = useCallback<ForgotPassword>(async (args) => {
    try {
      const res = await fetch('/api/users/forgot-password', {
        body: JSON.stringify({
          email: args.email,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const result = await readAPIResponse(res)
      if (!res.ok) {
        throw getAPIError(res, result, 'Unable to request a password reset.')
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unable to request a password reset.')
    }
  }, [])

  const resetPassword = useCallback<ResetPassword>(async (args) => {
    try {
      const res = await fetch('/api/users/reset-password', {
        body: JSON.stringify({
          password: args.password,
          passwordConfirm: args.passwordConfirm,
          token: args.token,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const result = await readAPIResponse(res)
      if (!res.ok) {
        throw getAPIError(res, result, 'Unable to reset the password.')
      }

      setUser(result.user || null)
      setStatus(result.user ? 'loggedIn' : 'loggedOut')
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unable to reset the password.')
    }
  }, [])

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

type UseAuth = () => AuthContext

export const useAuth: UseAuth = () => useContext(Context)
