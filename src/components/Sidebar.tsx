import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, FileText, DollarSign,
  Truck, Package, Calendar, LogOut, Layers
} from 'lucide-react'
import AlferLogo from './AlferLogo'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/contratos', icon: FileText, label: 'Contratos' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { to: '/equipamentos', icon: Package, label: 'Equipamentos' },
  { to: '/caminhoes', icon: Truck, label: 'Caminhões' },
  { to: '/cacambas', icon: Layers, label: 'Caçambas' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
]

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col z-40" style={{ background: '#1A1C1E', borderRight: '1px solid #2A2C2E' }}>
      <div className="p-5 border-b" style={{ borderColor: '#2A2C2E' }}>
        <AlferLogo size={32} />
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? { background: '#FFAF06' } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="p-4 border-t" style={{ borderColor: '#2A2C2E' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-900 text-xs font-bold" style={{ background: '#FFAF06' }}>
            {usuario?.nome?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{usuario?.nome}</div>
            <div className="text-gray-500 text-xs">{usuario?.perfil}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
