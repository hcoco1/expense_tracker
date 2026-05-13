import { LogOut, LayoutDashboard, PlusCircle, Tags, Plus, Palette, Globe, ShieldCheck, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp, ADMIN_EMAILS } from '../context/AppContext'
import { useT, LANGUAGES } from '../i18n'
import { supabase } from '../lib/supabase'

// All 29 DaisyUI built-in themes grouped for display
const THEMES = [
  { group: 'Dark', items: ['night', 'dark', 'synthwave', 'cyberpunk', 'halloween', 'forest', 'black', 'luxury', 'dracula', 'business', 'coffee'] },
  { group: 'Light', items: ['light', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'retro', 'valentine', 'garden', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'cmyk', 'autumn', 'acid', 'lemonade', 'winter'] },
]

export default function Layout({ title, subtitle, children, onAddClick, onShareClick, activePage }) {
  const t = useT()
  const { theme, setTheme, language, setLanguage, session } = useApp()
  const navigate = useNavigate()
  const isAdmin = ADMIN_EMAILS.includes(session?.user?.email)

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="w-full min-h-screen pb-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Topbar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-4 py-4 pb-5"
          style={{ background: 'linear-gradient(180deg, oklch(var(--b1)) 70%, transparent)' }}
        >
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black leading-tight truncate">{title}</h1>
            <p className="text-base-content/60 text-sm mt-0.5 truncate">{subtitle}</p>
          </div>

          <div className="flex gap-1 shrink-0">
            {/* Theme picker */}
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-sm btn-square" aria-label={t('Theme')}>
                <Palette size={17} />
              </button>
              <div tabIndex={0} className="dropdown-content z-[60] mt-1 p-2 shadow-2xl bg-base-200 border border-base-300 rounded-2xl w-52 max-h-80 overflow-y-auto">
                {THEMES.map(({ group, items }) => (
                  <div key={group}>
                    <p className="text-xs font-bold uppercase text-base-content/40 px-2 py-1">{group}</p>
                    {items.map((name) => (
                      <button
                        key={name}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-sm capitalize transition-colors hover:bg-base-300 ${theme === name ? 'bg-primary/20 font-bold text-primary' : ''}`}
                        onClick={() => setTheme(name)}
                        data-theme={name}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Language picker */}
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-sm btn-square" aria-label={t('Language')}>
                <Globe size={17} />
              </button>
              <div tabIndex={0} className="dropdown-content z-[60] mt-1 p-2 shadow-2xl bg-base-200 border border-base-300 rounded-2xl w-40">
                {LANGUAGES.map(({ code, label, flag }) => (
                  <button
                    key={code}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-sm transition-colors hover:bg-base-300 flex items-center gap-2 ${language === code ? 'bg-primary/20 font-bold text-primary' : ''}`}
                    onClick={() => setLanguage(code)}
                  >
                    <span>{flag}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Share */}
            {onShareClick && (
              <button className="btn btn-ghost btn-sm btn-square" onClick={onShareClick} aria-label={t('Share')}>
                <Share2 size={17} />
              </button>
            )}

            {/* Logout */}
            <button className="btn btn-ghost btn-sm btn-square" onClick={handleLogout} aria-label={t('Logout')}>
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex flex-col gap-4">{children}</main>
      </div>

      {/* FAB */}
      <button
        className="btn btn-primary btn-circle fixed z-30 shadow-2xl"
        style={{
          bottom: '5.8rem',
          right: 'max(1.25rem, calc((100vw - 1024px) / 2 + 1.25rem))',
          width: 62,
          height: 62,
        }}
        onClick={onAddClick}
        aria-label={t('Add')}
      >
        <Plus size={26} />
      </button>

      {/* Bottom nav — z-[25] is intentional (between FAB z-30 and content z-20) */}
      <nav className="fixed bottom-0 left-0 right-0 z-[25] mb-2 px-2">
        <div
          className="flex items-center justify-around max-w-5xl mx-auto py-2 px-2 rounded-3xl border border-base-300 shadow-2xl backdrop-blur-xl"
          style={{ background: 'oklch(var(--b2) / 0.9)' }}
        >
          <NavBtn active={activePage === 'dashboard'} onClick={() => navigate('/dashboard')} icon={<LayoutDashboard size={20} />} label={t('Home')} />
          <NavBtn active={false} onClick={onAddClick} icon={<PlusCircle size={20} />} label={t('Add')} />
          <NavBtn active={activePage === 'categories'} onClick={() => navigate('/categories')} icon={<Tags size={20} />} label={t('Categories')} />
          {isAdmin && (
            <NavBtn active={activePage === 'admin'} onClick={() => navigate('/admin')} icon={<ShieldCheck size={20} />} label={t('Admin')} />
          )}
        </div>
      </nav>
    </div>
  )
}

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button
      className={`flex flex-col sm:flex-row items-center gap-1 px-3 py-2 rounded-2xl font-bold text-sm transition-colors ${
        active ? 'bg-primary/15 text-base-content' : 'text-base-content/50 hover:text-base-content'
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="text-xs sm:text-sm">{label}</span>
    </button>
  )
}
