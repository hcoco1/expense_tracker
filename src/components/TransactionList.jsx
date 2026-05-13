import { RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { filteredExpenses } from '../lib/filters'
import { formatCurrency, formatDate, colorClass } from '../lib/utils'
import CategoryIcon from './CategoryIcon'

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
    </div>
  )
}

export default function TransactionList({ loading, onEdit, onDelete, onRefresh }) {
  const t = useT()
  const { expenses, categories, filters } = useApp()
  const filtered = filteredExpenses(expenses, filters, categories)

  function getCategory(expense) {
    return expense.categories || categories.find((c) => c.id === expense.category_id)
  }

  return (
    <article className="card bg-base-200 border border-base-300 shadow-md">
      <div className="card-body p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title text-sm uppercase tracking-wider text-base-content/60">{t('Recent Transactions')}</h2>
          <button className="btn btn-ghost btn-sm gap-1" onClick={onRefresh}>
            <RefreshCw size={14} />{t('Refresh')}
          </button>
        </div>

        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-base-300 rounded-2xl grid place-items-center min-h-44 text-center p-6 text-base-content/50">
            <div>
              <strong className="block">{t('No transactions here')}</strong>
              <p className="text-sm mt-1">{t('Add income or expenses to start seeing patterns.')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3" aria-live="polite">
            {filtered.slice(0, 30).map((expense) => {
              const category = getCategory(expense)
              const type = category?.type || 'expense'
              const sign = type === 'income' ? '+' : '-'
              return (
                <article key={expense.id} className="grid items-center gap-3 p-3 rounded-2xl border border-base-300 bg-base-100/50" style={{ gridTemplateColumns: '46px 1fr auto' }}>
                  <div className={`w-11 h-11 rounded-2xl grid place-items-center text-white shrink-0 ${colorClass(category?.color)}`} aria-hidden="true">
                    <CategoryIcon icon={category?.icon || 'circle-dollar-sign'} />
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate font-bold">{expense.note || category?.name || 'Transaction'}</strong>
                    <span className="text-xs text-base-content/60">
                      {category?.name || t('Uncategorized')} · {expense.payment_method || t('Other')} · {formatDate(expense.expense_date)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-black text-sm ${type === 'income' ? 'text-success' : 'text-error'}`}>
                      {sign}{formatCurrency(expense.amount, filters.currency)}
                    </div>
                    <div className="flex justify-end gap-1 mt-1">
                      <button className="btn btn-ghost btn-xs btn-square" onClick={() => onEdit(expense)} aria-label="Edit"><Pencil size={13} /></button>
                      <button className="btn btn-ghost btn-xs btn-square text-error" onClick={() => onDelete(expense.id)} aria-label="Delete"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}
