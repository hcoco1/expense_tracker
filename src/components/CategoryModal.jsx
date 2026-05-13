import { useEffect, useState } from 'react'
import { X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { categoryColors, categoryIcons } from '../lib/constants'
import { colorClass } from '../lib/utils'
import CategoryIcon from './CategoryIcon'

export default function CategoryModal({ open, category, onClose }) {
  const t = useT()
  const { createCategory, updateCategory } = useApp()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'expense', color: '#3b82f6', icon: 'circle-dollar-sign' })

  useEffect(() => {
    if (open) {
      setForm({
        name: category?.name || '',
        type: category?.type || 'expense',
        color: category?.color || '#3b82f6',
        icon: category?.icon || 'circle-dollar-sign',
      })
    }
  }, [open, category?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll lock + ESC
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
    try {
      if (category?.id) {
        await updateCategory(category.id, form)
        toast.success(t('Category updated.'))
      } else {
        await createCategory(form)
        toast.success(t('Category created.'))
      }
      onClose()
    } catch (err) {
      toast.error(err.message || t('Unable to save category.'))
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
            <h2 className="card-title">{category ? t('Edit Category') : t('Add Category')}</h2>
            <button className="btn btn-ghost btn-sm btn-square" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="form-control gap-1">
              <label className="label py-0"><span className="label-text text-xs font-bold uppercase text-base-content/60">{t('Name')}</span></label>
              <input className="input input-bordered w-full" type="text" maxLength={40} required value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>

            <div className="form-control gap-1">
              <label className="label py-0"><span className="label-text text-xs font-bold uppercase text-base-content/60">{t('Type')}</span></label>
              <select className="select select-bordered w-full" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="expense">{t('Expense')}</option>
                <option value="income">{t('Income')}</option>
              </select>
            </div>

            <div className="form-control gap-2">
              <span className="label-text text-xs font-bold uppercase text-base-content/60">{t('Color')}</span>
              <div className="grid grid-cols-6 gap-2">
                {categoryColors.map((color) => (
                  <button key={color} type="button"
                    className={`h-11 rounded-2xl border-2 transition-all ${colorClass(color)} ${form.color === color ? 'border-white ring-2 ring-primary/60 scale-95' : 'border-transparent'}`}
                    onClick={() => set('color', color)} aria-label={`Choose ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="form-control gap-2">
              <span className="label-text text-xs font-bold uppercase text-base-content/60">{t('Icon')}</span>
              <div className="grid grid-cols-6 gap-2">
                {categoryIcons.map((icon) => (
                  <button key={icon} type="button"
                    className={`h-11 rounded-2xl border-2 grid place-items-center transition-all bg-base-300 ${form.icon === icon ? 'border-white ring-2 ring-primary/60 scale-95' : 'border-transparent'}`}
                    onClick={() => set('icon', icon)} aria-label={`Choose ${icon}`}
                  >
                    <CategoryIcon icon={icon} size={16} />
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary gap-2" type="submit" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : <Save size={16} />}
              {loading ? t('Saving…') : t('Save Category')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
