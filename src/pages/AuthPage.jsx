import { useState } from 'react'
import { WalletCards, LogIn, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, isConfigured } from '../lib/supabase'
import { useT } from '../i18n'
import { usePageTitle } from '../hooks/usePageTitle'

export default function AuthPage() {
  const t = useT()
  usePageTitle(t('Expense Tracker'))
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isConfigured) {
      toast.error(t('Supabase is not configured. Check your .env file.'))
      return
    }
    setLoading(true)
    try {
      const { error } = await (mode === 'login'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password }))
      if (error) throw error
      toast.success(mode === 'login'
        ? t('Welcome back.')
        : t('Account created. Check your inbox if email confirmation is enabled.'))
    } catch (err) {
      toast.error(err.message || t('Authentication failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-5">
      <section className="w-full max-w-sm">
        <div className="card bg-base-200 border border-base-300 shadow-2xl">
          <div className="card-body gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg">
                <WalletCards size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black leading-tight">{t('Expense Tracker')}</h1>
                <p className="text-base-content/60 text-sm">{t('Private spending insights.')}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="join w-full">
              <button className={`join-item btn btn-sm flex-1 ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('login')} type="button">
                {t('Login')}
              </button>
              <button className={`join-item btn btn-sm flex-1 ${mode === 'register' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('register')} type="button">
                {t('Register')}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <div className="form-control gap-1">
                <label className="label py-0">
                  <span className="label-text text-xs font-bold uppercase text-base-content/60">{t('Email')}</span>
                </label>
                <input className="input input-bordered w-full" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-control gap-1">
                <label className="label py-0">
                  <span className="label-text text-xs font-bold uppercase text-base-content/60">{t('Password')}</span>
                </label>
                <input className="input input-bordered w-full" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button className="btn btn-primary w-full gap-2" type="submit" disabled={loading}>
                {loading
                  ? <span className="loading loading-spinner loading-sm" />
                  : mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                {loading ? '…' : mode === 'login' ? t('Login') : t('Create Account')}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
