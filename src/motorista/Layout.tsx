import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuthMotorista } from './AuthMotoristaContext'
import { LogOut, Truck } from 'lucide-react'
import { iconePorTipoCaminhao } from './iconesCaminhao'

export default function MotoristaLayout() {
  const { motorista, caminhao, logout } = useAuthMotorista()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/m/login')
  }

  const icone = caminhao ? iconePorTipoCaminhao[caminhao.tipo] : null

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header fixo, mobile-first */}
      <header
        className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-3"
        style={{ borderColor: '#E0DDD8' }}
      >
        <Link to="/m/operacoes" className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: icone ? '#FFFFFF' : '#FFAF06', border: icone ? '1px solid #E0DDD8' : 'none' }}
          >
            {icone ? (
              <img src={`/icones/${icone}`} alt={caminhao!.tipo} className="w-7 h-7 object-contain" />
            ) : (
              <Truck className="w-5 h-5 text-gray-900" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">{motorista?.nome || 'Motorista'}</div>
            <div className="text-xs text-gray-500 truncate">
              {caminhao ? `${caminhao.codigo} · ${caminhao.placa || caminhao.modelo}` : 'Sem veículo'}
            </div>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          aria-label="Sair"
          className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
        >
          <LogOut className="w-5 h-5 text-gray-600" />
        </button>
      </header>

      <main className="px-4 py-4 pb-24 max-w-md mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
