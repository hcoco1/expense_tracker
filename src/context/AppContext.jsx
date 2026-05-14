import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { defaultCategories } from '../lib/constants'
import { filteredExpenses as applyFilters } from '../lib/filters'

const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

export const ADMIN_EMAILS = ['arias.ivan@gmail.com']

/** Check admin status via app_metadata role (server-issued) with email fallback. */
export function isAdminUser(session) {
  return (
    session?.user?.app_metadata?.role === 'admin' ||
    ADMIN_EMAILS.includes(session?.user?.email)
  )
}

export function AppProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [filters, setFilters] = useState({
    category: 'all',
    period: localStorage.getItem('expense_tracker_period') || 'month',
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: String(new Date().getFullYear()),
    customStart: new Date().toISOString().slice(0, 10),
    customEnd: new Date().toISOString().slice(0, 10),
    currency: localStorage.getItem('expense_tracker_currency') || 'USD',
  })
  const [theme, setTheme] = useState(localStorage.getItem('expense_tracker_theme') || 'night')
  const [language, setLanguage] = useState(localStorage.getItem('expense_tracker_lang') || 'en')

  // Memoized filtered expenses — computed once, shared across all consumers
  const filtered = useMemo(
    () => applyFilters(expenses, filters, categories),
    [expenses, filters, categories]
  )

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('expense_tracker_theme', theme)
  }, [theme])

  // Persist language
  useEffect(() => {
    localStorage.setItem('expense_tracker_lang', language)
  }, [language])

  // Auth listener
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) { setCategories([]); setExpenses([]) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load localStorage cache when user logs in
  useEffect(() => {
    if (!session?.user?.id) return
    const uid = session.user.id
    const c = localStorage.getItem(`expense_tracker_${uid}_categories`)
    const e = localStorage.getItem(`expense_tracker_${uid}_expenses`)
    if (c) setCategories(JSON.parse(c))
    if (e) setExpenses(JSON.parse(e))
  }, [session?.user?.id])

  // Auto-save cache on data change
  useEffect(() => {
    if (!session?.user?.id) return
    const uid = session.user.id
    localStorage.setItem(`expense_tracker_${uid}_categories`, JSON.stringify(categories))
    localStorage.setItem(`expense_tracker_${uid}_expenses`, JSON.stringify(expenses))
  }, [session?.user?.id, categories, expenses])

  // Realtime subscription — incremental updates instead of full re-fetch
  useEffect(() => {
    if (!supabase || !session?.user?.id) return
    const uid = session.user.id

    const channel = supabase
      .channel('expense-tracker-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${uid}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setExpenses((prev) => prev.filter((e) => e.id !== payload.old.id))
          } else {
            // INSERT or UPDATE: fetch the single changed row with its category join
            supabase
              .from('expenses')
              .select('*, categories(*)')
              .eq('id', payload.new.id)
              .single()
              .then(({ data }) => {
                if (!data) return
                setExpenses((prev) =>
                  payload.eventType === 'INSERT'
                    ? [data, ...prev]
                    : prev.map((e) => (e.id === data.id ? data : e))
                )
              })
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'period') localStorage.setItem('expense_tracker_period', value)
      if (key === 'currency') localStorage.setItem('expense_tracker_currency', value)
      return next
    })
  }, [])

  // ── Categories ──────────────────────────────────────────────────────────────

  const seedDefaultCategories = useCallback(async () => {
    if (!supabase || !session?.user?.id) return
    const uid = session.user.id
    const seedKey = `expense_tracker_${uid}_seeded`

    // Skip DB query entirely if we already seeded for this user
    if (localStorage.getItem(seedKey)) return

    const { data, error } = await supabase.from('categories').select('id').eq('user_id', uid).limit(1)
    if (error) throw error

    // Mark seeded whether the user already has categories or we're about to insert
    localStorage.setItem(seedKey, '1')
    if (data.length) return

    const rows = defaultCategories.map((c) => ({ ...c, user_id: uid }))
    const { error: ie } = await supabase.from('categories').insert(rows)
    if (ie) throw ie
  }, [session?.user?.id])

  const fetchCategories = useCallback(async () => {
    if (!supabase || !session?.user?.id) return []
    const { data, error } = await supabase
      .from('categories').select('*').eq('user_id', session.user.id).order('type').order('name')
    if (error) throw error
    setCategories(data || [])
    return data || []
  }, [session?.user?.id])

  const createCategory = useCallback(async (payload) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase
      .from('categories').insert({ ...payload, user_id: session.user.id }).select().single()
    if (error) throw error
    setCategories((prev) => [...prev, data].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)))
    return data
  }, [session?.user?.id])

  const updateCategory = useCallback(async (id, payload) => {
    if (!supabase) throw new Error('Supabase not configured')
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...payload } : c)))
    const { data, error } = await supabase
      .from('categories').update(payload).eq('id', id).eq('user_id', session.user.id).select().single()
    if (error) { fetchCategories(); throw error }
    setCategories((prev) => prev.map((c) => (c.id === id ? data : c)))
    return data
  }, [session?.user?.id, fetchCategories])

  const deleteCategory = useCallback(async (id) => {
    if (!supabase) throw new Error('Supabase not configured')
    setCategories((prev) => prev.filter((c) => c.id !== id))
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', session.user.id)
    if (error) { fetchCategories(); throw error }
  }, [session?.user?.id, fetchCategories])

  // ── Expenses ────────────────────────────────────────────────────────────────

  const fetchExpenses = useCallback(async () => {
    if (!supabase || !session?.user?.id) return []
    const { data, error } = await supabase
      .from('expenses').select('*, categories(*)')
      .eq('user_id', session.user.id)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw error
    setExpenses(data || [])
    return data || []
  }, [session?.user?.id])

  const createExpense = useCallback(async (payload) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase
      .from('expenses').insert({ ...payload, user_id: session.user.id }).select('*, categories(*)').single()
    if (error) throw error
    setExpenses((prev) => [data, ...prev])
    return data
  }, [session?.user?.id])

  const updateExpense = useCallback(async (id, payload) => {
    if (!supabase) throw new Error('Supabase not configured')
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...payload } : e)))
    const { data, error } = await supabase
      .from('expenses').update(payload).eq('id', id).eq('user_id', session.user.id)
      .select('*, categories(*)').single()
    if (error) { fetchExpenses(); throw error }
    setExpenses((prev) => prev.map((e) => (e.id === id ? data : e)))
    return data
  }, [session?.user?.id, fetchExpenses])

  const deleteExpense = useCallback(async (id) => {
    if (!supabase) throw new Error('Supabase not configured')
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', session.user.id)
    if (error) { fetchExpenses(); throw error }
  }, [session?.user?.id, fetchExpenses])

  return (
    <AppContext.Provider value={{
      session, authLoading, isConfigured,
      categories, expenses, filtered, filters, theme, setTheme, language, setLanguage,
      updateFilter,
      seedDefaultCategories, fetchCategories, createCategory, updateCategory, deleteCategory,
      fetchExpenses, createExpense, updateExpense, deleteExpense,
    }}>
      {children}
    </AppContext.Provider>
  )
}
