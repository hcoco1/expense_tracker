import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { filteredExpenses, buildTrendBuckets, periodLabel } from '../lib/filters'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

function chartTextColor() {
  // DaisyUI v3 sets color:oklch(var(--bc)) on [data-theme]; read the resolved RGB from body
  const color = getComputedStyle(document.body).color
  return color || '#94a3b8'
}

export default function Charts() {
  const t = useT()
  const { expenses, categories, filters, theme } = useApp()
  const filtered = filteredExpenses(expenses, filters, categories)
  const label = t(periodLabel(filters.period))

  // Category doughnut — expense only
  const expOnly = filtered.filter((e) => {
    const type = e.categories?.type || categories.find((c) => c.id === e.category_id)?.type
    return type !== 'income'
  })

  const byCategory = new Map()
  expOnly.forEach((e) => {
    const cat = e.categories || categories.find((c) => c.id === e.category_id)
    const key = cat?.name || t('Uncategorized')
    const cur = byCategory.get(key) || { value: 0, color: cat?.color || '#64748b' }
    cur.value += Number(e.amount || 0)
    byCategory.set(key, cur)
  })

  const catValues = [...byCategory.values()].map((v) => v.value)
  const doughnutData = {
    labels: [...byCategory.keys()],
    datasets: [{ data: catValues.length ? catValues : [1], backgroundColor: catValues.length ? [...byCategory.values()].map((v) => v.color) : ['#334155'], borderWidth: 0 }],
  }

  // Trend line
  const buckets = buildTrendBuckets(filters, expenses)
  const trendData = buckets.map((bucket) =>
    expenses.reduce((total, e) => {
      const date = new Date(`${e.expense_date}T00:00:00`)
      const type = e.categories?.type || categories.find((c) => c.id === e.category_id)?.type
      return date >= bucket.start && date <= bucket.end && type !== 'income' ? total + Number(e.amount || 0) : total
    }, 0)
  )

  const textColor = chartTextColor()

  return (
    <>
      <article className="card bg-base-200 border border-base-300 shadow-md">
        <div className="card-body p-5">
          <h2 className="card-title text-sm uppercase tracking-wider text-base-content/60 mb-3">{t('Category Mix')}</h2>
          <div className="relative h-64">
            <Doughnut
              key={`doughnut-${theme}`}
              data={doughnutData}
              options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: textColor, boxWidth: 10, usePointStyle: true } }, tooltip: { enabled: Boolean(catValues.length) } } }}
            />
          </div>
        </div>
      </article>

      <article className="card bg-base-200 border border-base-300 shadow-md">
        <div className="card-body p-5">
          <h2 className="card-title text-sm uppercase tracking-wider text-base-content/60 mb-3">{label} {t('Trend')}</h2>
          <div className="relative h-64">
            <Line
              key={`trend-${theme}`}
              data={{ labels: buckets.map((b) => b.label), datasets: [{ data: trendData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.16)', fill: true, tension: 0.38, pointRadius: 4, pointBackgroundColor: '#3b82f6' }] }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor }, grid: { display: false } }, y: { ticks: { color: textColor }, grid: { color: 'rgba(148,163,184,0.14)' } } } }}
            />
          </div>
        </div>
      </article>
    </>
  )
}
