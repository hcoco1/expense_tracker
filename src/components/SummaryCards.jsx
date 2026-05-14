import { Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { calculateSummary, periodLabel } from '../lib/filters'
import { formatCurrency } from '../lib/utils'

export default function SummaryCards() {
  const t = useT()
  const { expenses, categories, filters, filtered } = useApp()

  const summary = calculateSummary(filtered, categories)
  const totalSummary = calculateSummary(expenses, categories)
  const label = t(periodLabel(filters.period))
  const rate = summary.income ? Math.max(0, Math.round((summary.balance / summary.income) * 100)) : 0

  return (
    <section className="grid gap-4 sm:grid-cols-[1.4fr_repeat(3,1fr)]" aria-label="Summary">
      <article className="card min-h-40 bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl overflow-hidden">
        <div className="card-body p-5">
          <p className="text-xs font-bold uppercase opacity-70">{t('Total Balance')}</p>
          <p className="text-4xl sm:text-5xl font-black mt-2">{formatCurrency(totalSummary.balance, filters.currency)}</p>
          <span className="flex items-center gap-1.5 mt-3 text-sm font-bold opacity-75">
            <Sparkles size={14} />
            {rate}% {t('saved in')} {label.toLowerCase()}
          </span>
        </div>
      </article>

      <article className="card bg-base-200 border border-base-300 shadow-md">
        <div className="card-body p-5">
          <p className="text-xs font-bold uppercase text-base-content/60">{t('Period Income')}</p>
          <p className="text-3xl font-black mt-2">{formatCurrency(summary.income, filters.currency)}</p>
        </div>
      </article>

      <article className="card bg-base-200 border border-base-300 shadow-md">
        <div className="card-body p-5">
          <p className="text-xs font-bold uppercase text-base-content/60">{t('Period Expenses')}</p>
          <p className="text-3xl font-black mt-2">{formatCurrency(summary.expense, filters.currency)}</p>
        </div>
      </article>

      <article className="card bg-base-200 border border-base-300 shadow-md">
        <div className="card-body p-5">
          <p className="text-xs font-bold uppercase text-base-content/60">{t('Savings')}</p>
          <p className="text-3xl font-black mt-2">{formatCurrency(summary.balance, filters.currency)}</p>
        </div>
      </article>
    </section>
  )
}
