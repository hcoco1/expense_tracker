import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider, useApp, ADMIN_EMAILS } from './context/AppContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import CategoriesPage from './pages/CategoriesPage'
import AdminPage from './pages/AdminPage'

function PrivateRoute({ children }) {
  const { session, authLoading } = useApp()
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }
  return session ? children : <Navigate to="/" replace />
}

function PublicRoute({ children }) {
  const { session, authLoading } = useApp()
  if (authLoading) return null
  return session ? <Navigate to="/dashboard" replace /> : children
}

function AdminRoute({ children }) {
  const { session, authLoading } = useApp()
  if (authLoading) return null
  if (!session) return <Navigate to="/" replace />
  if (!ADMIN_EMAILS.includes(session.user?.email)) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', fontWeight: 700, borderRadius: '14px' },
        }}
      />
      <Routes>
        <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/categories" element={<PrivateRoute><CategoriesPage /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
