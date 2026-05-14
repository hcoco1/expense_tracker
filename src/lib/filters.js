function toLocalDate(value) {
  return new Date(`${value}T00:00:00`)
}

function startOfWeek(date) {
  const copy = new Date(date)
  const day = copy.getDay() || 7
  copy.setDate(copy.getDate() - day + 1)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfDay(date) {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

export function periodLabel(period) {
  return { week: 'This Week', month: 'This Month', year: 'This Year', all: 'All Time', custom: 'Custom Period' }[period] || 'This Month'
}

export function getPeriodRange(filters) {
  const { period, year, month, customStart, customEnd } = filters
  const now = new Date()

  if (period === 'week') {
    const start = startOfWeek(now)
    const end = endOfDay(new Date(start))
    end.setDate(start.getDate() + 6)
    return { start, end }
  }

  if (period === 'year') {
    const y = Number(year)
    return { start: new Date(y, 0, 1), end: endOfDay(new Date(y, 11, 31)) }
  }

  if (period === 'all') return { start: null, end: null }

  if (period === 'custom') {
    const start = toLocalDate(customStart)
    const end = endOfDay(toLocalDate(customEnd))
    return start <= end ? { start, end } : { start: toLocalDate(customEnd), end: endOfDay(toLocalDate(customStart)) }
  }

  const y = Number(year)
  const m = Number(month) - 1
  return { start: new Date(y, m, 1), end: endOfDay(new Date(y, m + 1, 0)) }
}

export function filteredExpenses(expenses, filters, categories) {
  const { start, end } = getPeriodRange(filters)
  return expenses.filter((expense) => {
    const date = toLocalDate(expense.expense_date)
    const categoryMatch = filters.category === 'all' || expense.category_id === filters.category
    const periodMatch = (!start || date >= start) && (!end || date <= end)
    return categoryMatch && periodMatch
  })
}

export function calculateSummary(expenses, categories) {
  return expenses.reduce(
    (summary, expense) => {
      const type =
        expense.categories?.type ||
        categories.find((c) => c.id === expense.category_id)?.type ||
        'expense'
      const amount = Number(expense.amount || 0)
      if (type === 'income') summary.income += amount
      else summary.expense += amount
      summary.balance = summary.income - summary.expense
      return summary
    },
    { income: 0, expense: 0, balance: 0 }
  )
}

export function buildTrendBuckets(filters, expenses) {
  const { period, year, month } = filters

  if (period === 'week') {
    const start = startOfWeek(new Date())
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return { label: date.toLocaleDateString(undefined, { weekday: 'short' }), start: date, end: endOfDay(date) }
    })
  }

  if (period === 'year') {
    const y = Number(year)
    return Array.from({ length: 12 }, (_, i) => {
      const start = new Date(y, i, 1)
      return { label: start.toLocaleDateString(undefined, { month: 'short' }), start, end: endOfDay(new Date(y, i + 1, 0)) }
    })
  }

  if (period === 'custom') {
    const { start, end } = getPeriodRange(filters)
    const days = Math.max(1, Math.round((end - start) / 86400000) + 1)
    if (days <= 31) {
      return Array.from({ length: days }, (_, i) => {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        return { label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), start: date, end: endOfDay(date) }
      })
    }
    // Custom range > 31 days: show monthly buckets spanning the actual range
    const months = []
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cursor <= end) {
      const mStart = new Date(cursor)
      const mEnd = endOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0))
      months.push({ label: mStart.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), start: mStart, end: mEnd })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return months
  }

  if (period === 'all') {
    const dates = expenses.map((e) => toLocalDate(e.expense_date))
    const last = dates.length ? new Date(Math.max(...dates)) : new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date(last.getFullYear(), last.getMonth() - (5 - i), 1)
      return { label: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), start: date, end: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0)) }
    })
  }

  return Array.from({ length: 6 }, (_, i) => {
    const date = new Date(Number(year), Number(month) - 1 - (5 - i), 1)
    return { label: date.toLocaleDateString(undefined, { month: 'short' }), start: date, end: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0)) }
  })
}
