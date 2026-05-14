import { filteredExpenses, calculateSummary, periodLabel } from './filters'
import { formatCurrency } from './utils'

/**
 * Build a human-readable share summary.
 * Accepts already-filtered expenses so the caller's memoized value is reused.
 * `t` defaults to identity so callers that don't supply it get English output.
 */
export function buildShareText(filtered, categories, filters, t = (k) => k) {
  const summary = calculateSummary(filtered, categories)
  const label = periodLabel(filters.period)
  const rate = summary.income
    ? Math.max(0, Math.round((summary.balance / summary.income) * 100))
    : 0

  const byCategory = new Map()
  filtered.forEach((e) => {
    const cat = e.categories || categories.find((c) => c.id === e.category_id)
    if (cat?.type === 'income') return
    const key = cat?.name || t('Uncategorized')
    byCategory.set(key, (byCategory.get(key) || 0) + Number(e.amount || 0))
  })
  const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)

  let text = `📊 Expense Tracker — ${t(label)}\n`
  text += `💰 ${t('Balance')}: ${formatCurrency(summary.balance, filters.currency)}\n`
  text += `📈 ${t('Income')}: ${formatCurrency(summary.income, filters.currency)}\n`
  text += `📉 ${t('Expenses')}: ${formatCurrency(summary.expense, filters.currency)}\n`
  if (rate > 0) text += `💾 ${t('savings rate')}: ${rate}%\n`
  if (top.length) {
    text += `\n${t('Top spending')}:\n`
    top.forEach(([name, amount]) => {
      text += `  • ${name}: ${formatCurrency(amount, filters.currency)}\n`
    })
  }
  text += `\nTracked with Expense Tracker 🚀`
  return text.trim()
}

/** Invoke the native Web Share API. Returns true if triggered, false if unavailable. */
export async function shareNative(title, text, url = window.location.origin) {
  if (!navigator.share) return false
  await navigator.share({ title, text, url })
  return true
}

/** Write text to the system clipboard. */
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
  } else {
    const el = document.createElement('textarea')
    el.value = text
    el.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

/**
 * Export filtered transactions as a UTF-8 CSV file with BOM (Excel-friendly).
 * Values starting with formula characters are prefixed with ' to prevent injection.
 */
export function downloadCSV(expenses, categories, filters) {
  const filtered = filteredExpenses(expenses, filters, categories)
  const headers = ['Date', 'Category', 'Type', 'Amount', 'Currency', 'Payment Method', 'Notes']

  const rows = filtered.map((e) => {
    const cat = e.categories || categories.find((c) => c.id === e.category_id)
    return [
      e.expense_date,
      cat?.name || 'Uncategorized',
      cat?.type || 'expense',
      e.amount,
      filters.currency,
      e.payment_method || '',
      (e.note || '').replace(/\n/g, ' '),
    ]
  })

  const escape = (v) => {
    const s = String(v)
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
    return `"${safe.replace(/"/g, '""')}"`
  }
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expenses-${filters.period}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** Export filtered transactions as a JSON file. */
export function downloadJSON(expenses, categories, filters) {
  const filtered = filteredExpenses(expenses, filters, categories).map((e) => {
    const cat = e.categories || categories.find((c) => c.id === e.category_id)
    return {
      date: e.expense_date,
      category: cat?.name || 'Uncategorized',
      type: cat?.type || 'expense',
      amount: Number(e.amount),
      currency: filters.currency,
      payment_method: e.payment_method || '',
      note: e.note || '',
    }
  })

  const payload = {
    exported_at: new Date().toISOString(),
    period: filters.period,
    currency: filters.currency,
    count: filtered.length,
    transactions: filtered,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expenses-${filters.period}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** true if the browser supports Web Share API */
export const canShareNatively = typeof navigator !== 'undefined' && !!navigator.share
