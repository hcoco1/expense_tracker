import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useT } from '../i18n'

export default function ConfirmModal({ open, title, message, onConfirm, onClose }) {
  const t = useT()

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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card bg-base-200 border border-base-300 shadow-2xl w-full max-w-sm animate-modalIn">
        <div className="card-body p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="card-title">{title}</h2>
            <button className="btn btn-ghost btn-sm btn-square" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
          <p className="text-base-content/60 text-sm">{message}</p>
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>{t('Cancel')}</button>
            <button className="btn btn-error btn-sm" onClick={onConfirm}>{t('Delete')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
