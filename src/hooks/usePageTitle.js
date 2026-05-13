import { useEffect } from 'react'

const APP_NAME = 'Expense Tracker'

export function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME
    return () => { document.title = prev }
  }, [title])
}
