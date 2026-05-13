import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { usePageTitle } from '../hooks/usePageTitle'
import Layout from '../components/Layout'
import CategoryList from '../components/CategoryList'
import CategoryModal from '../components/CategoryModal'
import ConfirmModal from '../components/ConfirmModal'

export default function CategoriesPage() {
  const t = useT()
  usePageTitle(t('Categories'))
  const { session, fetchCategories, deleteCategory, seedDefaultCategories } = useApp()
  const [dataLoading, setDataLoading] = useState(true)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        await seedDefaultCategories()
        await fetchCategories()
      } catch (err) {
        toast.error(err.message || t('Showing cached categories.'))
      } finally {
        setDataLoading(false)
      }
    }
    if (session?.user?.id) init()
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() { setEditingCategory(null); setCatModalOpen(true) }
  function openEdit(cat) { setEditingCategory(cat); setCatModalOpen(true) }
  function openDelete(id) { setPendingDeleteId(id); setConfirmOpen(true) }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return
    try {
      await deleteCategory(pendingDeleteId)
      toast.success(t('Category deleted.'))
    } catch (err) {
      toast.error(err.message || t('Unable to delete category.'))
    } finally {
      setPendingDeleteId(null)
      setConfirmOpen(false)
    }
  }

  return (
    <Layout title={t('Categories')} subtitle={t('Shape your spending and income labels.')} onAddClick={openAdd} activePage="categories">
      <div className="card bg-base-200 border border-base-300 shadow-md">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title text-sm uppercase tracking-wider text-base-content/60">{t('Your Categories')}</h2>
            <button className="btn btn-primary btn-sm gap-1" onClick={openAdd}>+ {t('Add')}</button>
          </div>
          <CategoryList loading={dataLoading} onEdit={openEdit} onDelete={openDelete} />
        </div>
      </div>

      <CategoryModal open={catModalOpen} category={editingCategory} onClose={() => setCatModalOpen(false)} />
      <ConfirmModal
        open={confirmOpen}
        title={t('Delete category?')}
        message={t('Transactions using this category must be reassigned or removed first.')}
        onConfirm={handleConfirmDelete}
        onClose={() => { setConfirmOpen(false); setPendingDeleteId(null) }}
      />
    </Layout>
  )
}
