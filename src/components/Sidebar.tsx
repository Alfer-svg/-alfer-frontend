import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useInboxAlert } from '../context/InboxAlertContext'
import {
  LayoutDashboard, Users, FileText, DollarSign,
  Truck, Package, Calendar, LogOut, Layers, User, ChevronDown, ChevronRight, FileSignature, Map, Forklift, KeyRound, ClipboardList, Building2, Shield, X, BarChart3
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
    basePath: '/orcamentos',
    children: [
      { to: '/crm', label: 'CRM (Pipeline)' },
      { to: '/leads', label: 'Leads (Pré-venda)' },
      { to: '/campanhas', label: 'Campanhas WhatsApp' },
      { to: '/inbox-whatsapp', label: 'Inbox WhatsApp 0800' },
      { to: '/orcamentos', label: 'Orçamentos' },
      { to: '/condicoes-orcamento', label: 'Condições padrão' },
      { to: '/pedidos', label: 'Pedidos' },
    ],
  },
  {
    label: 'Locações',
    icon: KeyRound,
    basePath: '/locacoes',
    children: [
      { to: '/locacoes', label: 'Visão geral' },
      { to: '/contratos', label: 'Contratos' },
      { to: '/cacambas', label: 'Caçambas' },
      { to: '/logistica', label: 'Logística' },
    ],
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    basePath: '/financeiro',
    children: [
      { to: '/financeiro', label: 'Lançamentos' },
      { to: '/emails-agendados', label: 'E-mails agendados' },
      { to: '/fornecedores', label: 'Fornecedores' },
      { to: '/emissores', label: 'Emissores (CNPJs)' },
    ],
  },
  {
    label: 'Relatórios',
    icon: BarChart3,
    basePath: '/relatorios',
    children: [
      { to: '/relatorios', label: 'Relatório Financeiro' },
    ],
  },
  {
    label: 'Equipamentos',
    icon: Package,
    basePath: '/equipamentos',
    children: [
      { to: '/equipamentos/estoque', label: 'Estoque' },
      { to: '/equipamentos', label: 'Cadastrar equipamentos' },
      { to: '/modelos', label: 'Cadastrar modelos' },
      { to: '/caminhoes', label: 'Frota' },
    ],
  },
  {
    label: 'OSs',
    icon: ClipboardList,
    basePath: '/ordens-servico',
    children: [
      { to: '/ordens-servico/munck', label: 'OS Munck' },
      { to: '/ordens-servico/poli', label: 'OS Poliguindaste' },
    ],
  },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/mapa', icon: Map, label: 'Mapa' },
]

export default function Sidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void } = {}) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Grupo "Pessoas" — sempre aparece com Motoristas; Usuários só pra ADMIN/GESTOR
  const podeVerUsuarios = usuario?.perfil === 'ADMIN' || usuario?.perfil === 'GESTOR'
  const pessoasGroup: GroupItem = {
    label: 'Pessoas',
    icon: User,
    basePath: '/motoristas',
    children: [
      { to: '/motoristas', label: 'Motoristas' },
      ...(podeVerUsuarios ? [{ to: '/usuarios', label: 'Usuários do sistema' }] : []),
    ],
  }

  // Insere "Pessoas" antes de Agenda/Mapa (depois de OSs)
  const navVisivel: NavItem[] = [...nav.slice(0, -2), pessoasGroup, ...nav.slice(-2)]

  const initialOpen: Record<string, boolean> = {}
  navVisivel.forEach((i) => {
    if (isGroup(i)) {
      const extras =
        i.label === 'Equipamentos' ? ['/modelos', '/caminhoes'] :
        i.label === 'Locações' ? ['/contratos', '/cacambas', '/logistica'] :
        i.label === 'Comercial' ? ['/crm', '/leads', '/campanhas', '/inbox-whatsapp', '/condicoes-orcamento', '/pedidos'] :
        []
      initialOpen[i.label] = i.children.some((c) => location.pathname.startsWith(c.to))
        || location.pathname.startsWith(i.basePath)
        || extras.some((e) => location.pathname.startsWith(e))
    }
  })
  const [open, setOpen] = useState(initialOpen)

  // Badge de mensagens WhatsApp não lidas (contador centralizado no InboxAlertContext)
  const { naoLidas: waNaoLidas } = useInboxAlert()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-60 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
      }`}
      style={{ background: '#FFFFFF', borderRight: '1px solid #E0DDD8' }}
    >
      <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#F1EFE8' }}>
        <AlferLogo size={96} />
        {/* Botão fechar (só mobile) */}
        <button
          onClick={onClose}
          aria-label="Fechar menu"
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-0.5">
          {navVisivel.map((item) => {
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
                    {item.label === 'Comercial' && waNaoLidas > 0 && !isOpen && (
                      <span
                        className="px-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                        style={{ background: '#25D366', color: '#FFFFFF' }}
                      >
                        {waNaoLidas > 99 ? '99+' : waNaoLidas}
                      </span>
                    )}
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {isOpen && (
                    <div className="mt-0.5 ml-2 pl-3 space-y-0.5" style={{ borderLeft: '1px solid #E0DDD8' }}>
                      {item.children.map((c) => {
                        const isInbox = c.to === '/inbox-whatsapp'
                        return (
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
                            <span className="flex-1 truncate">{c.label}</span>
                            {isInbox && waNaoLidas > 0 && (
                              <span
                                className="px-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                                style={{ background: '#25D366', color: '#FFFFFF' }}
                                aria-label={`${waNaoLidas} não lidas`}
                              >
                                {waNaoLidas > 99 ? '99+' : waNaoLidas}
                              </span>
                            )}
                          </NavLink>
                        )
                      })}
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
