import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { defaultCategories } from '../lib/constants'

const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

export const ADMIN_EMAILS = ['arias.ivan@gmail.com']

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
    const { data, error } = await supabase.from('categories').select('id').eq('user_id', uid).limit(1)
    if (error) throw error
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
    const { data, error } = await supabase
      .from('categories').insert({ ...payload, user_id: session.user.id }).select().single()
    if (error) throw error
    setCategories((prev) => [...prev, data].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)))
    return data
  }, [session?.user?.id])

  const updateCategory = useCallback(async (id, payload) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...payload } : c)))
    const { data, error } = await supabase
      .from('categories').update(payload).eq('id', id).eq('user_id', session.user.id).select().single()
    if (error) { fetchCategories(); throw error }
    setCategories((prev) => prev.map((c) => (c.id === id ? data : c)))
    return data
  }, [session?.user?.id, fetchCategories])

  const deleteCategory = useCallback(async (id) => {
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
    if (error) throw error
    setExpenses(data || [])
    return data || []
  }, [session?.user?.id])

  const createExpense = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('expenses').insert({ ...payload, user_id: session.user.id }).select('*, categories(*)').single()
    if (error) throw error
    setExpenses((prev) => [data, ...prev])
    return data
  }, [session?.user?.id])

  const updateExpense = useCallback(async (id, payload) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...payload } : e)))
    const { data, error } = await supabase
      .from('expenses').update(payload).eq('id', id).eq('user_id', session.user.id)
      .select('*, categories(*)').single()
    if (error) { fetchExpenses(); throw error }
    setExpenses((prev) => prev.map((e) => (e.id === id ? data : e)))
    return data
  }, [session?.user?.id, fetchExpenses])

  const deleteExpense = useCallback(async (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', session.user.id)
    if (error) { fetchExpenses(); throw error }
  }, [session?.user?.id, fetchExpenses])

  return (
    <AppContext.Provider value={{
      session, authLoading, isConfigured,
      categories, expenses, filters, theme, setTheme, language, setLanguage,
      updateFilter,
      seedDefaultCategories, fetchCategories, createCategory, updateCategory, deleteCategory,
      fetchExpenses, createExpense, updateExpense, deleteExpense,
    }}>
      {children}
    </AppContext.Provider>
  )
}
