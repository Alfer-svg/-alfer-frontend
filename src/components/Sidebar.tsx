import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, FileText, DollarSign,
  Truck, Package, Calendar, LogOut, Layers, User, ChevronDown, ChevronRight, FileSignature, Map, Forklift, KeyRound
} from 'lucide-react'
import AlferLogo from './AlferLogo'

type SimpleItem = { to: string; icon: any; label: string }
type GroupItem = { label: string; icon: any; basePath: string; children: { to: string; label: string }[] }
type NavItem = SimpleItem | GroupItem

const isGroup = (i: NavItem): i is GroupItem => 'children' in i

const nav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  {
    label: 'Comercial',
    icon: FileSignature,
    basePath: '/contratos',
    children: [
      { to: '/orcamentos', label: 'Orçamentos' },
      { to: '/condicoes-orcamento', label: 'Condições padrão' },
      { to: '/pedidos', label: 'Pedidos' },
      { to: '/contratos', label: 'Contratos' },
    ],
  },
  { to: '/locacoes', icon: KeyRound, label: 'Locações' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  {
    label: 'Equipamentos',
    icon: Package,
    basePath: '/equipamentos',
    children: [
      { to: '/equipamentos', label: 'Cadastrar equipamentos' },
      { to: '/modelos', label: 'Cadastrar modelos' },
    ],
  },
  { to: '/caminhoes', icon: Truck, label: 'Caminhões' },
  { to: '/cacambas', icon: Layers, label: 'Caçambas' },
  { to: '/logistica', icon: Forklift, label: 'Logística' },
  { to: '/motoristas', icon: User, label: 'Motoristas' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/mapa', icon: Map, label: 'Mapa' },
]

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const initialOpen: Record<string, boolean> = {}
  nav.forEach((i) => {
    if (isGroup(i)) {
      const extras = i.label === 'Equipamentos' ? ['/modelos'] : []
      initialOpen[i.label] = i.children.some((c) => location.pathname.startsWith(c.to))
        || location.pathname.startsWith(i.basePath)
        || extras.some((e) => location.pathname.startsWith(e))
    }
  })
  const [open, setOpen] = useState(initialOpen)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col z-40" style={{ background: '#FFFFFF', borderRight: '1px solid #E0DDD8' }}>
      <div className="p-5 border-b flex items-center justify-center" style={{ borderColor: '#F1EFE8' }}>
        <AlferLogo size={96} />
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-0.5">
          {nav.map((item) => {
            if (isGroup(item)) {
              const Icon = item.icon
              const isOpen = !!open[item.label]
              const childActive = item.children.some((c) => location.pathname.startsWith(c.to))
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [item.label]: !o[item.label] }))}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      childActive ? 'text-gray-900 bg-gray-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {isOpen && (
                    <div className="mt-0.5 ml-2 pl-3 space-y-0.5" style={{ borderLeft: '1px solid #E0DDD8' }}>
                      {item.children.map((c) => (
                        <NavLink
                          key={c.to}
                          to={c.to}
                          end
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`
                          }
                          style={({ isActive }) => (isActive ? { background: '#FFAF06' } : {})}
                        >
                          {c.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            const { to, icon: Icon, label } = item
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
                style={({ isActive }) => isActive ? { background: '#FFAF06' } : {}}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            )
          })}
        </div>
      </nav>
      <div className="p-4 border-t" style={{ borderColor: '#F1EFE8' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-900 text-xs font-bold" style={{ background: '#FFAF06' }}>
            {usuario?.nome?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-gray-900 text-sm font-medium truncate">{usuario?.nome}</div>
            <div className="text-gray-500 text-xs">{usuario?.perfil}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
