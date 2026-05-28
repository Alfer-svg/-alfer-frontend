import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthMotorista } from '../AuthMotoristaContext'
import apiMotorista from '../api'
import { Truck, ChevronRight, AlertCircle } from 'lucide-react'

export default function MotoristaVeiculo() {
  const { caminhao } = useAuthMotorista()
  const navigate = useNavigate()
  const [checklistHoje, setChecklistHoje] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiMotorista.get('/motorista-app/me/checklist-hoje')
      .then((r) => setChecklistHoje(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!caminhao) {
    return (
      <div className="rounded-2xl bg-white border p-6 text-center" style={{ borderColor: '#E0DDD8' }}>
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
        <div className="font-medium text-gray-900 mb-1">Sem veículo alocado</div>
        <div className="text-sm text-gray-500">
          Procure o gestor pra alocar um caminhão à sua matrícula.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Seu veículo</h1>

      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E0DDD8' }}>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FEF3E2' }}
          >
            <Truck className="w-7 h-7" style={{ color: '#FFAF06' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg text-gray-900 truncate">{caminhao.codigo}</div>
            <div className="text-sm text-gray-500 truncate">{caminhao.modelo}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-400">Placa</div>
            <div className="font-medium text-gray-900">{caminhao.placa || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Tipo</div>
            <div className="font-medium text-gray-900">{caminhao.tipo}</div>
          </div>
        </div>
      </div>

      {checklistHoje ? (
        <div
          className="rounded-2xl border p-5"
          style={{ background: '#E8F5E9', borderColor: '#C8E6C9' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-600" />
            <div className="font-medium text-green-900 text-sm">Check-list de hoje já feito</div>
          </div>
          <div className="text-xs text-green-800">
            Registrado às {new Date(checklistHoje.dtRegistro).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
            Pode seguir pras operações.
          </div>
          <button
            onClick={() => navigate('/m/operacoes')}
            className="w-full mt-4 py-3 rounded-xl font-semibold text-gray-900 active:opacity-80"
            style={{ background: '#FFAF06' }}
          >
            Ver operações do dia
          </button>
        </div>
      ) : (
        <button
          onClick={() => navigate('/m/checklist')}
          className="w-full py-4 rounded-2xl bg-white border-2 border-dashed flex items-center justify-between px-5 active:bg-gray-50"
          style={{ borderColor: '#FFAF06' }}
        >
          <div className="text-left">
            <div className="font-semibold text-gray-900">Fazer check-list</div>
            <div className="text-xs text-gray-500 mt-0.5">
              4 fotos + itens em conformidade
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      )}
    </div>
  )
}
