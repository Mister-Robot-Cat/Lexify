'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, clearToken, getToken, setToken } from '@/lib/api'
import { translate } from '@/lib/i18n'
import type { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    email: string
    password: string
    display_name?: string
    language?: string
    learning_language?: string
    ui_language?: string
  }) => Promise<void>
  loginWithTelegram: (initData: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
  t: (key: string, params?: Record<string, string | number>) => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      return
    }
    try {
      const userData = await api.users.me()
      setUser(userData)
    } catch {
      clearToken()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const login = async (email: string, password: string) => {
    const { access_token } = await api.auth.login(email, password)
    setToken(access_token)
    await refresh()
  }

  const register: AuthContextType['register'] = async (payload) => {
    const { access_token } = await api.auth.register(payload)
    setToken(access_token)
    await refresh()
  }

  const loginWithTelegram = async (initData: string) => {
    if (!initData?.trim()) return
    try {
      const { access_token } = await api.auth.telegram(initData)
      setToken(access_token)
      await refresh()
    } catch (err) {
      console.warn('Telegram authentication failed:', err)
      throw err
    }
  }

  const logout = () => {
    clearToken()
    setUser(null)
    window.location.href = '/'
  }

  const t = (key: string, params?: Record<string, string | number>) =>
    translate(user?.ui_language ?? 'en', key, params)

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithTelegram, logout, refresh, t }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
