export const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'BRL', 'MXN']

export const defaultCategories = [
  ['Food', '#f97316', 'utensils', 'expense'],
  ['Transport', '#06b6d4', 'bus', 'expense'],
  ['Rent', '#8b5cf6', 'home', 'expense'],
  ['Utilities', '#eab308', 'zap', 'expense'],
  ['Entertainment', '#ec4899', 'popcorn', 'expense'],
  ['Health', '#ef4444', 'heart-pulse', 'expense'],
  ['Gym', '#22c55e', 'dumbbell', 'expense'],
  ['Shopping', '#a855f7', 'shopping-bag', 'expense'],
  ['Travel', '#14b8a6', 'plane', 'expense'],
  ['Salary', '#22c55e', 'briefcase', 'income'],
  ['Freelance', '#3b82f6', 'laptop', 'income'],
  ['Other', '#64748b', 'circle-dollar-sign', 'expense'],
].map(([name, color, icon, type]) => ({ name, color, icon, type }))

export const categoryColors = [
  '#3b82f6',
  '#22c55e',
  '#ef4444',
  '#f97316',
  '#8b5cf6',
  '#14b8a6',
  '#eab308',
  '#ec4899',
  '#64748b',
  '#06b6d4',
  '#a855f7',
  '#10b981',
]

export const categoryIcons = [
  'utensils',
  'bus',
  'home',
  'zap',
  'popcorn',
  'heart-pulse',
  'dumbbell',
  'shopping-bag',
  'plane',
  'briefcase',
  'laptop',
  'circle-dollar-sign',
]
