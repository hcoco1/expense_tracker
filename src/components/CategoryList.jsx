import { Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { colorClass } from '../lib/utils'
import CategoryIcon from './CategoryIcon'

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
    </div>
  )
}

export default function CategoryList({ loading, onEdit, onDelete }) {
  const t = useT()
  const { categories } = useApp()

  if (loading) return <Skeleton />

  if (!categories.length) {
    return (
      <div className="border border-dashed border-base-300 rounded-2xl grid place-items-center min-h-44 text-center p-6 text-base-content/50">
        <div>
          <strong className="block">{t('No categories yet')}</strong>
          <p className="text-sm mt-1">{t('Create your first label to organize transactions.')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {categories.map((category) => (
        <article key={category.id} className="grid items-center gap-3 p-3 rounded-2xl border border-base-300 bg-base-100/50" style={{ gridTemplateColumns: '46px 1fr auto' }}>
          <div className={`w-11 h-11 rounded-2xl grid place-items-center text-white shrink-0 ${colorClass(category.color)}`} aria-hidden="true">
            <CategoryIcon icon={category.icon} />
          </div>
          <div className="min-w-0">
            <strong className="block font-bold">{category.name}</strong>
            <span className="text-xs text-base-content/60">{category.type === 'income' ? t('Income') : t('Expense')}</span>
          </div>
          <div className="flex gap-1 shrink-0">
            <button className="btn btn-ghost btn-sm btn-square" onClick={() => onEdit(category)} aria-label={`Edit ${category.name}`}><Pencil size={15} /></button>
            <button className="btn btn-ghost btn-sm btn-square text-error" onClick={() => onDelete(category.id)} aria-label={`Delete ${category.name}`}><Trash2 size={15} /></button>
          </div>
        </article>
      ))}
    </div>
  )
}
