import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Fecha o drawer quando muda de rota
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Bloqueia scroll do body quando drawer aberto no mobile
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <div className="flex min-h-screen" style={{ background: '#F5F0EB' }}>
      {/* Botão hambúrguer fixo (visível só no mobile) */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        className="lg:hidden fixed top-4 left-4 z-30 w-11 h-11 flex items-center justify-center rounded-xl bg-white shadow-lg"
        style={{ border: '1px solid #E0DDD8' }}
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Backdrop (só mobile, só quando aberto) */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="flex-1 min-h-screen lg:ml-60 pt-16 lg:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
