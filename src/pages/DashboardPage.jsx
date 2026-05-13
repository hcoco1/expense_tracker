import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { usePageTitle } from '../hooks/usePageTitle'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import SummaryCards from '../components/SummaryCards'
import FiltersBar from '../components/FiltersBar'
import TransactionList from '../components/TransactionList'
import Charts from '../components/Charts'
import TransactionModal from '../components/TransactionModal'
import ShareModal from '../components/ShareModal'
import ConfirmModal from '../components/ConfirmModal'

export default function DashboardPage() {
  const t = useT()
  usePageTitle(t('Dashboard'))

  const { session, fetchCategories, fetchExpenses, deleteExpense, seedDefaultCategories } = useApp()
  const [dataLoading, setDataLoading] = useState(true)
  const [txModalOpen, setTxModalOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        await seedDefaultCategories()
        await Promise.all([fetchCategories(), fetchExpenses()])
      } catch (err) {
        toast.error(err.message || t('Showing cached data.'))
      } finally {
        setDataLoading(false)
      }
    }
    if (session?.user?.id) init()
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!supabase || !session?.user?.id) return
    const channel = supabase
      .channel('expense-tracker-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${session.user.id}` },
        () => fetchExpenses())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() { setEditingExpense(null); setTxModalOpen(true) }
  function openEdit(expense) { setEditingExpense(expense); setTxModalOpen(true) }
  function openDelete(id) { setPendingDeleteId(id); setConfirmOpen(true) }

  async function handleRefresh() {
    try {
      await Promise.all([fetchCategories(), fetchExpenses()])
      toast.success(t('Dashboard updated.'))
    } catch (err) {
      toast.error(err.message || t('Unable to refresh.'))
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return
    try {
      await deleteExpense(pendingDeleteId)
      toast.success(t('Transaction deleted.'))
    } catch (err) {
      toast.error(err.message || t('Unable to delete transaction.'))
    } finally {
      setPendingDeleteId(null)
      setConfirmOpen(false)
    }
  }

  return (
    <Layout
      title={t("Today's Money")}
      subtitle={t('Track every move with clarity.')}
      onAddClick={openAdd}
      onShareClick={() => setShareOpen(true)}
      activePage="dashboard"
    >
      <SummaryCards />
      <FiltersBar />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <TransactionList loading={dataLoading} onEdit={openEdit} onDelete={openDelete} onRefresh={handleRefresh} />
        <div className="grid gap-4"><Charts /></div>
      </div>

      <TransactionModal open={txModalOpen} expense={editingExpense} onClose={() => setTxModalOpen(false)} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
      <ConfirmModal
        open={confirmOpen}
        title={t('Delete transaction?')}
        message={t('This action cannot be undone.')}
        onConfirm={handleConfirmDelete}
        onClose={() => { setConfirmOpen(false); setPendingDeleteId(null) }}
      />
    </Layout>
  )
}
