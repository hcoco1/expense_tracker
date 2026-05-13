import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { currencies } from '../lib/constants'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: new Date(2026, i, 1).toLocaleDateString(undefined, { month: 'long' }),
}))

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 7 }, (_, i) => String(currentYear - 5 + i))

export default function FiltersBar() {
  const t = useT()
  const { filters, updateFilter, categories } = useApp()
  const isCustom = filters.period === 'custom'
  const showMonth = filters.period === 'month'
  const showYear = filters.period === 'month' || filters.period === 'year'

  return (
    <section className="card bg-base-200 border border-base-300 shadow-md" aria-label="Filters">
      <div className="card-body p-4">
        <div className="flex flex-wrap gap-3">
          <select className="select select-bordered select-sm flex-1 min-w-36" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} aria-label="Filter by category">
            <option value="all">{t('All categories')}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select className="select select-bordered select-sm" value={filters.period} onChange={(e) => updateFilter('period', e.target.value)}>
            <option value="week">{t('This week')}</option>
            <option value="month">{t('This month')}</option>
            <option value="year">{t('This year')}</option>
            <option value="all">{t('All time')}</option>
            <option value="custom">{t('Custom')}</option>
          </select>

          {showMonth && (
            <select className="select select-bordered select-sm" value={filters.month} onChange={(e) => updateFilter('month', e.target.value)}>
              {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          )}

          {showYear && (
            <select className="select select-bordered select-sm" value={filters.year} onChange={(e) => updateFilter('year', e.target.value)}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}

          {isCustom && (
            <>
              <input className="input input-bordered input-sm" type="date" value={filters.customStart} onChange={(e) => updateFilter('customStart', e.target.value)} />
              <input className="input input-bordered input-sm" type="date" value={filters.customEnd} onChange={(e) => updateFilter('customEnd', e.target.value)} />
            </>
          )}

          <select className="select select-bordered select-sm" value={filters.currency} onChange={(e) => updateFilter('currency', e.target.value)}>
            {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </section>
  )
}
