import { useState } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuthMotorista } from './AuthMotoristaContext'
import { LogOut, Truck, ShieldCheck, HardHat } from 'lucide-react'
import { iconePorTipoCaminhao } from './iconesCaminhao'
import { dicaAleatoria, type DicaSeguranca } from './dicasSeguranca'

export default function MotoristaLayout() {
  const { motorista, caminhao, modo, logout } = useAuthMotorista()
  const navigate = useNavigate()
  const patio = modo === 'patio'

  // Mostra uma dica de segurança logo após o login (flag setada no login()).
  const [dica, setDica] = useState<DicaSeguranca | null>(() => {
    if (sessionStorage.getItem('alfer_motorista_dica')) {
      sessionStorage.removeItem('alfer_motorista_dica')
      return dicaAleatoria(modo)
    }
    return null
  })

  const handleLogout = () => {
    logout()
    navigate('/m/login')
  }

  const icone = caminhao ? iconePorTipoCaminhao[caminhao.tipo] : null

  if (dica) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#FAF9F6]">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide mb-6" style={{ color: '#9a7b1a' }}>
            <ShieldCheck className="w-4 h-4" />
            <span>Dica do dia</span>
          </div>
          <div
            className="rounded-3xl px-7 py-9"
            style={{ background: '#FEF3E2', border: '1px solid #FFAF06' }}
          >
            <div className="text-6xl mb-4">{dica.emoji}</div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{dica.titulo}</h2>
            <p className="text-gray-700 text-base leading-relaxed">{dica.texto}</p>
          </div>
          <button
            type="button"
            onClick={() => setDica(null)}
            className="w-full py-3.5 rounded-xl font-semibold text-gray-900 text-base active:opacity-80 mt-7"
            style={{ background: '#FFAF06' }}
          >
            Entendi, vamos lá
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header fixo, mobile-first */}
      <header
        className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-3"
        style={{ borderColor: '#E0DDD8' }}
      >
        <Link to={patio ? '/m/tarefas' : '/m/operacoes'} className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: icone ? '#FFFFFF' : '#FFAF06', border: icone ? '1px solid #E0DDD8' : 'none' }}
          >
            {icone ? (
              <img
                src={`/icones/${icone}`}
                alt={caminhao!.tipo}
                className="w-7 h-7 object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
            ) : patio ? (
              <HardHat className="w-5 h-5 text-gray-900" />
            ) : (
              <Truck className="w-5 h-5 text-gray-900" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">{motorista?.nome || 'Funcionário'}</div>
            <div className="text-xs text-gray-500 truncate">
              {patio
                ? (motorista?.cargo || 'Operações de pátio')
                : caminhao
                  ? `${caminhao.codigo} · ${caminhao.placa || caminhao.modelo}`
                  : 'Sem veículo'}
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
