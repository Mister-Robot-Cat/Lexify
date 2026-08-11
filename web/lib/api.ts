import type {
  ActivityPoint,
  AddWordsResult,
  AnswerResult,
  ChatMessage,
  IeltsEvaluation,
  IeltsSummary,
  LanguageCatalog,
  LookupResult,
  QuizMode,
  QuizSession,
  ShadowingBookmark,
  ShadowingTranscript,
  ShadowingVideoSummary,
  Stats,
  TopicPack,
  User,
  Word,
  WordList,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

const TOKEN_KEY = 'lexify_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Skip the automatic redirect to /login on a 401. */
  silent?: boolean
}

export async function request<T>(
  endpoint: string,
  { body, silent, ...options }: RequestOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401 && !silent) {
    clearToken()
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }

  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    let detail = response.statusText || 'Request failed'
    if (data) {
      if (typeof data.detail === 'string') {
        detail = data.detail
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        detail = data.detail.map((err: any) => err?.msg || String(err)).join(', ')
      } else if (typeof data.message === 'string') {
        detail = data.message
      }
    }
    throw new ApiError(detail, response.status)
  }

  return data as T
}

/** Typed endpoint map — the single place that knows the API surface. */
export const api = {
  auth: {
    register: (payload: {
      email: string
      password: string
      display_name?: string
      language?: string
      learning_language?: string
      ui_language?: string
    }) => request<{ access_token: string }>('/auth/register', { method: 'POST', body: payload }),

    login: (email: string, password: string) =>
      request<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      }),

    telegram: (initData: string) =>
      request<{ access_token: string }>('/auth/telegram', {
        method: 'POST',
        body: { initData },
      }),

    linkTelegram: (initData: string) =>
      request<User>('/auth/link-telegram', { method: 'POST', body: { initData } }),
  },

  users: {
    me: () => request<User>('/users/me', { silent: true }),
    update: (
      payload: Partial<
        Pick<User, 'display_name' | 'language' | 'ui_language' | 'learning_language' | 'daily_goal'>
      >
    ) => request<User>('/users/me', { method: 'PATCH', body: payload }),
    stats: () => request<Stats>('/users/me/stats'),
    activity: (days = 90) => request<ActivityPoint[]>(`/users/me/activity?days=${days}`),
    languages: () => request<LanguageCatalog>('/users/languages'),
  },

  words: {
    list: (
      params: {
        search?: string
        level?: string
        filter?: string
        sort?: string
        page?: number
        page_size?: number
      } = {}
    ) => {
      const query = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          query.set(key, String(value))
        }
      })
      const suffix = query.toString() ? `?${query}` : ''
      return request<WordList>(`/words/${suffix}`)
    },

    lookup: (text: string) =>
      request<LookupResult>('/words/lookup', { method: 'POST', body: { text } }),

    add: (words: string[]) =>
      request<AddWordsResult>('/words/', { method: 'POST', body: { words } }),

    get: (id: number) => request<Word>(`/words/${id}`),

    remove: (id: number) => request<void>(`/words/${id}`, { method: 'DELETE' }),

    wordOfTheDay: () => request<Word>('/words/word-of-the-day', { silent: true }),
  },

  quiz: {
    session: (mode: QuizMode, size = 10) =>
      request<QuizSession>(`/quiz/session?mode=${mode}&size=${size}`, { silent: true }),

    answer: (word_id: number, answer: string, mode: QuizMode) =>
      request<AnswerResult>('/quiz/answer', {
        method: 'POST',
        body: { word_id, answer, mode },
      }),
  },

  chat: {
    history: () => request<ChatMessage[]>('/chat/'),
    send: (message: string) => request<ChatMessage>('/chat/', { method: 'POST', body: { message } }),
    clear: () => request<void>('/chat/', { method: 'DELETE' }),
  },

  ielts: {
    evaluate: (text: string, title?: string) =>
      request<IeltsEvaluation>('/ielts/evaluate', { method: 'POST', body: { text, title } }),
    list: () => request<IeltsSummary[]>('/ielts/'),
    get: (id: number) => request<IeltsEvaluation>(`/ielts/${id}`),
    remove: (id: number) => request<void>(`/ielts/${id}`, { method: 'DELETE' }),
  },

  topics: {
    list: () => request<TopicPack[]>('/topics/'),
    add: (key: string) => request<AddWordsResult>(`/topics/${key}/add`, { method: 'POST' }),
  },

  shadowing: {
    videos: () => request<ShadowingVideoSummary[]>('/shadowing/videos'),
    transcript: (videoId: string) =>
      request<ShadowingTranscript>(`/shadowing/videos/${videoId}/transcript`, { silent: true }),
    submitTranscript: (videoId: string, text: string, title?: string) =>
      request<ShadowingTranscript>(`/shadowing/videos/${videoId}/transcript`, {
        method: 'POST',
        body: { text, title },
      }),
    bookmark: (video_id: string, title: string, last_position: number) =>
      request<ShadowingBookmark>('/shadowing/bookmarks', {
        method: 'PUT',
        body: { video_id, title, last_position },
      }),
    removeBookmark: (videoId: string) =>
      request<void>(`/shadowing/bookmarks/${videoId}`, { method: 'DELETE' }),
  },
}
