import { useEffect, useState } from 'react'
import { X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { currentDateInput } from '../lib/utils'

const PAYMENT_METHODS = ['Card', 'Cash', 'Bank Transfer', 'Wallet', 'Other']

export default function TransactionModal({ open, expense, onClose }) {
  const t = useT()
  const { categories, createExpense, updateExpense } = useApp()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    amount: '', category_id: '', payment_method: 'Card',
    expense_date: currentDateInput(), note: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        amount: expense?.amount || '',
        category_id: expense?.category_id || categories[0]?.id || '',
        payment_method: expense?.payment_method || 'Card',
        expense_date: expense?.expense_date || currentDateInput(),
        note: expense?.note || '',
      })
    }
  }, [open, expense?.id, categories.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll lock + ESC close
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      amount: Number(form.amount),
      category_id: form.category_id,
      payment_method: form.payment_method,
      expense_date: form.expense_date,
      note: form.note.trim(),
    }
    try {
      if (expense?.id) {
        await updateExpense(expense.id, payload)
        toast.success(t('Transaction updated.'))
      } else {
        await createExpense(payload)
        toast.success(t('Transaction added.'))
      }
      onClose()
    } catch (err) {
      toast.error(err.message || t('Unable to save transaction.'))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card bg-base-200 border border-base-300 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto animate-modalIn">
        <div className="card-body p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="card-title">{expense ? t('Edit Transaction') : t('Add Transaction')}</h2>
            <button className="btn btn-ghost btn-sm btn-square" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field label={t('Amount')}>
              <input className="input input-bordered w-full" type="number" min="0.01" step="0.01" inputMode="decimal" required value={form.amount} onChange={(e) => set('amount', e.target.value)} />
            </Field>

            <Field label={t('Category')}>
              <select className="select select-bordered w-full" required value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                {categories.length === 0 && <option value="">{t('Create a category first')}</option>}
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({t(c.type === 'income' ? 'Income' : 'Expense')})</option>)}
              </select>
            </Field>

            <Field label={t('Payment Method')}>
              <select className="select select-bordered w-full" required value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t(m)}</option>)}
              </select>
            </Field>

            <Field label={t('Date')}>
              <input className="input input-bordered w-full" type="date" required value={form.expense_date} onChange={(e) => set('expense_date', e.target.value)} />
            </Field>

            <Field label={t('Notes')}>
              <textarea className="textarea textarea-bordered w-full" maxLength={240} placeholder={t('Optional')} value={form.note} onChange={(e) => set('note', e.target.value)} />
            </Field>

            <button className="btn btn-primary gap-2" type="submit" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : <Save size={16} />}
              {loading ? t('Saving…') : t('Save Transaction')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="form-control gap-1">
      <label className="label py-0">
        <span className="label-text text-xs font-bold uppercase text-base-content/60">{label}</span>
      </label>
      {children}
    </div>
  )
}
