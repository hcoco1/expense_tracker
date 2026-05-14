import { useEffect, useState } from 'react'
import { X, Share2, Copy, Download, FileJson, Check, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { calculateSummary, periodLabel } from '../lib/filters'
import { formatCurrency } from '../lib/utils'
import {
  buildShareText, shareNative, copyToClipboard,
  downloadCSV, downloadJSON, canShareNatively,
} from '../lib/share'

export default function ShareModal({ open, onClose }) {
  const t = useT()
  const { expenses, categories, filters, filtered } = useApp()
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  const summary    = calculateSummary(filtered, categories)
  const label      = periodLabel(filters.period)
  const shareText  = buildShareText(filtered, categories, filters, t)
  const rate       = summary.income
    ? Math.max(0, Math.round((summary.balance / summary.income) * 100))
    : 0

  // Top 3 spending categories for preview
  const byCategory = new Map()
  filtered.forEach((e) => {
    const cat = e.categories || categories.find((c) => c.id === e.category_id)
    if (cat?.type === 'income') return
    const key = cat?.name || t('Uncategorized')
    byCategory.set(key, (byCategory.get(key) || 0) + Number(e.amount || 0))
  })
  const topCats = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)

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

  async function handleShare() {
    setSharing(true)
    try {
      const ok = await shareNative(t('Expense Tracker'), shareText)
      if (!ok) {
        await doCopy()
      }
    } catch (err) {
      if (err.name !== 'AbortError') toast.error(err.message)
    } finally {
      setSharing(false)
    }
  }

  async function doCopy() {
    await copyToClipboard(shareText)
    setCopied(true)
    toast.success(t('Summary copied to clipboard.'))
    setTimeout(() => setCopied(false), 2500)
  }

  function handleCSV() {
    downloadCSV(expenses, categories, filters)
    toast.success(t('Downloading CSV…'))
  }

  function handleJSON() {
    downloadJSON(expenses, categories, filters)
    toast.success(t('Downloading JSON…'))
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card bg-base-200 border border-base-300 shadow-2xl w-full max-w-lg max-h-[92vh] overflow-auto animate-modalIn">
        <div className="card-body p-5 gap-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="card-title">{t('Share & Export')}</h2>
            <button className="btn btn-ghost btn-sm btn-square" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>

          {/* Period summary stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-base-300 rounded-2xl p-3">
              <div className="flex items-center justify-center gap-1 mb-1 text-success">
                <TrendingUp size={14} />
              </div>
              <p className="text-lg font-black text-success">{formatCurrency(summary.income, filters.currency)}</p>
              <p className="text-xs text-base-content/50 mt-0.5">{t('Income')}</p>
            </div>
            <div className="bg-base-300 rounded-2xl p-3">
              <div className="flex items-center justify-center gap-1 mb-1 text-error">
                <TrendingDown size={14} />
              </div>
              <p className="text-lg font-black text-error">{formatCurrency(summary.expense, filters.currency)}</p>
              <p className="text-xs text-base-content/50 mt-0.5">{t('Expenses')}</p>
            </div>
            <div className="bg-base-300 rounded-2xl p-3">
              <div className="flex items-center justify-center gap-1 mb-1 text-primary">
                <Wallet size={14} />
              </div>
              <p className={`text-lg font-black ${summary.balance >= 0 ? 'text-success' : 'text-error'}`}>
                {formatCurrency(summary.balance, filters.currency)}
              </p>
              <p className="text-xs text-base-content/50 mt-0.5">{t('Balance')}</p>
            </div>
          </div>

          {/* Top categories */}
          {topCats.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-base-content/40">{t('Top spending')} — {t(label)}</p>
              {topCats.map(([name, amount]) => {
                const pct = summary.expense ? Math.round((amount / summary.expense) * 100) : 0
                return (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-sm flex-1 truncate font-medium">{name}</span>
                    <div className="flex-1 bg-base-300 rounded-full h-2">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-black w-24 text-right">{formatCurrency(amount, filters.currency)}</span>
                    <span className="text-xs text-base-content/40 w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Text preview */}
          <div className="bg-base-300 rounded-2xl p-4">
            <p className="text-xs font-bold uppercase text-base-content/40 mb-2">{t('Preview')}</p>
            <pre className="text-sm whitespace-pre-wrap font-mono text-base-content/80 leading-relaxed">{shareText}</pre>
          </div>

          {/* Share / copy actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn btn-primary gap-2"
              onClick={handleShare}
              disabled={sharing}
            >
              {sharing
                ? <span className="loading loading-spinner loading-sm" />
                : <Share2 size={16} />}
              {canShareNatively ? t('Share') : t('Share')}
            </button>

            <button
              className={`btn gap-2 ${copied ? 'btn-success' : 'btn-ghost border border-base-300'}`}
              onClick={doCopy}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? t('Copied!') : t('Copy text')}
            </button>
          </div>

          {/* Export actions */}
          <div>
            <p className="text-xs font-bold uppercase text-base-content/40 mb-2">{t('Export data')} ({filtered.length} {t('Transactions').toLowerCase()})</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-ghost border border-base-300 gap-2" onClick={handleCSV}>
                <Download size={16} />
                {t('Download CSV')}
              </button>
              <button className="btn btn-ghost border border-base-300 gap-2" onClick={handleJSON}>
                <FileJson size={16} />
                {t('Download JSON')}
              </button>
            </div>
          </div>

          {/* Savings rate badge */}
          {rate > 0 && (
            <p className="text-xs text-center text-base-content/40">
              {rate}% {t('savings rate')} · {t(label)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
