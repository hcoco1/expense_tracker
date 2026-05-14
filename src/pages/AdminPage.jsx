import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Users, ReceiptText, Tags, ShieldAlert, RefreshCw } from 'lucide-react'
import { useApp, isAdminUser } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n'
import { usePageTitle } from '../hooks/usePageTitle'
import Layout from '../components/Layout'
import { formatCurrency } from '../lib/utils'

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-md">
      <div className="card-body p-5 flex-row items-center gap-4">
        <div className={`p-3 rounded-2xl bg-base-300 ${color}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-base-content/50">{label}</p>
          <p className="text-2xl font-black">{value}</p>
          {sub && <p className="text-xs text-base-content/50 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const t = useT()
  usePageTitle(t('Admin'))
  const { session, expenses, categories, filters } = useApp()
  const [adminData, setAdminData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isAdmin = isAdminUser(session)

  const loadAdminData = useCallback(async () => {
    if (!supabase || !isAdmin) return
    setLoading(true)
    setError(null)
    try {
      // Query aggregated stats — succeeds fully only with admin RLS policies;
      // falls back to current user's data with default RLS.
      const [expR, catR] = await Promise.all([
        supabase.from('expenses').select('user_id, amount, expense_date, categories(type)'),
        supabase.from('categories').select('user_id, type'),
      ])

      if (expR.error) throw expR.error
      if (catR.error) throw catR.error

      const allExp = expR.data || []
      const allCat = catR.data || []

      const userMap = {}
      allExp.forEach(({ user_id, amount, categories: cat }) => {
        if (!userMap[user_id]) userMap[user_id] = { expenses: 0, income: 0, spend: 0 }
        userMap[user_id].expenses++
        const type = cat?.type || 'expense'
        if (type === 'income') userMap[user_id].income += Number(amount)
        else userMap[user_id].spend += Number(amount)
      })
      allCat.forEach(({ user_id }) => {
        if (!userMap[user_id]) userMap[user_id] = { expenses: 0, income: 0, spend: 0 }
      })

      setAdminData({
        users: Object.entries(userMap).map(([id, stats]) => ({ id, ...stats })),
        totalExp: allExp.length,
        totalCat: allCat.length,
        uniqueUsers: Object.keys(userMap).length,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) loadAdminData()
    else setLoading(false)
  }, [isAdmin, loadAdminData])

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  // Own stats from context (always available)
  const ownIncome = expenses.reduce((s, e) => {
    const type = e.categories?.type || categories.find((c) => c.id === e.category_id)?.type
    return type === 'income' ? s + Number(e.amount) : s
  }, 0)
  const ownSpend = expenses.reduce((s, e) => {
    const type = e.categories?.type || categories.find((c) => c.id === e.category_id)?.type
    return type !== 'income' ? s + Number(e.amount) : s
  }, 0)

  return (
    <Layout
      title={t('Admin')}
      subtitle={t('User Management')}
      onAddClick={() => {}}
      activePage="admin"
    >
      {/* Admin notice */}
      <div className="alert alert-info text-sm">
        <ShieldAlert size={18} className="shrink-0" />
        <span>
          {t('Admin note: Full cross-user visibility requires admin RLS policies or a Supabase Edge Function with the service role key.')}
        </span>
      </div>

      {/* Overview */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase text-base-content/50">{t('Overview')}</h2>
          <button className="btn btn-ghost btn-xs gap-1" onClick={loadAdminData} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {t('Refresh')}
          </button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : error ? (
          <div className="alert alert-error text-sm">{error}</div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard icon={Users} label={t('Total Users')} value={adminData?.uniqueUsers ?? 1} color="text-primary" />
            <StatCard icon={ReceiptText} label={t('Total Transactions')} value={adminData?.totalExp ?? expenses.length} color="text-secondary" />
            <StatCard icon={Tags} label={t('Total Categories')} value={adminData?.totalCat ?? categories.length} color="text-accent" />
          </div>
        )}
      </section>

      {/* Per-user breakdown */}
      {!loading && !error && adminData?.users.length > 0 && (
        <section className="card bg-base-200 border border-base-300 shadow-md">
          <div className="card-body p-5">
            <h2 className="card-title text-sm uppercase tracking-wider text-base-content/50 mb-4">{t('User Management')}</h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>{t('User ID')}</th>
                    <th className="text-right">{t('Transactions')}</th>
                    <th className="text-right">{t('Income')}</th>
                    <th className="text-right">{t('Expenses')}</th>
                    <th className="text-right">{t('Balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {adminData.users.map(({ id, expenses: expCount, income, spend }) => (
                    <tr key={id} className={id === session?.user?.id ? 'bg-primary/10' : ''}>
                      <td className="font-mono text-xs">
                        {id === session?.user?.id ? (
                          <span className="flex items-center gap-1">
                            {id.slice(0, 8)}…
                            <span className="badge badge-primary badge-xs">you</span>
                          </span>
                        ) : `${id.slice(0, 8)}…`}
                      </td>
                      <td className="text-right font-bold">{expCount}</td>
                      <td className="text-right text-success font-bold">{formatCurrency(income, filters.currency)}</td>
                      <td className="text-right text-error font-bold">{formatCurrency(spend, filters.currency)}</td>
                      <td className={`text-right font-black ${income - spend >= 0 ? 'text-success' : 'text-error'}`}>
                        {formatCurrency(income - spend, filters.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Your own stats (always visible) */}
      <section className="card bg-base-200 border border-base-300 shadow-md">
        <div className="card-body p-5">
          <h2 className="card-title text-sm uppercase tracking-wider text-base-content/50 mb-4">{t('Your Stats')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: t('Transactions'), value: expenses.length },
              { label: t('Categories'), value: categories.length },
              { label: t('Income'), value: formatCurrency(ownIncome, filters.currency) },
              { label: t('Expenses'), value: formatCurrency(ownSpend, filters.currency) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-base-300 rounded-2xl p-4">
                <p className="text-2xl font-black">{value}</p>
                <p className="text-xs text-base-content/50 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
