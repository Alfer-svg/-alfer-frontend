import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Package, Search, Plus, ChevronRight, MapPin, Wrench } from 'lucide-react'

const tipoLabel: Record<string, string> = {
  CONTAINER_SECO: 'Container Seco',
  CONTAINER_REEFER: 'Container Reefer',
  CACAMBA_ESTACIONARIA: 'Caçamba Estacionária',
  CAMINHAO_MUNCK: 'Caminhão Munck',
}

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  DISPONIVEL: { bg: '#EAF3DE', text: '#27500A', label: 'Disponível' },
  LOCADO: { bg: '#E3EEFA', text: '#1A5276', label: 'Locado' },
  MANUTENCAO: { bg: '#FEF3E2', text: '#633806', label: 'Manutenção' },
  INATIVO: { bg: '#F1EFE8', text: '#888', label: 'Inativo' },
}

export default function Equipamentos() {
  const navigate = useNavigate()
  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  useEffect(() => {
    const params: any = {}
    if (filtroTipo) params.tipo = filtroTipo
    if (filtroStatus) params.status = filtroStatus
    if (busca) params.q = busca
    setLoading(true)
    const t = setTimeout(() => {
      api.get('/equipamentos', { params })
        .then((r) => setEquipamentos(r.data))
        .finally(() => setLoading(false))
    }, busca ? 300 : 0)
    return () => clearTimeout(t)
  }, [busca, filtroTipo, filtroStatus])

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Equipamentos</h1>
          <p className="text-gray-500 text-sm mt-1">{equipamentos.length} equipamentos cadastrados</p>
        </div>
        <button
          onClick={() => navigate('/equipamentos/novo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" />
          Novo equipamento
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por código ou modelo..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl text-sm outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(tipoLabel).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos os status</option>
          <option value="DISPONIVEL">Disponíveis</option>
          <option value="LOCADO">Locados</option>
          <option value="MANUTENCAO">Em manutenção</option>
          <option value="INATIVO">Inativos</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : equipamentos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum equipamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {equipamentos.map((e) => {
            const status = statusColor[e.status] || statusColor.DISPONIVEL
            return (
              <div
                key={e.id}
                onClick={() => navigate(`/equipamentos/${e.id}`)}
                className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all animate-fade-in"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FEF3E2' }}
                >
                  <Package className="w-5 h-5" style={{ color: '#FFAF06' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{e.codigo}</span>
                    <span className="text-sm text-gray-700">{e.modelo}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: status.bg, color: status.text }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <span>{tipoLabel[e.tipo] || e.tipo}</span>
                    <span>{e.capacidade}</span>
                    <span>{e.ano}</span>
                    {e.localizacao && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {e.localizacao}
                      </span>
                    )}
                    {e.manutencoes?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> {e.manutencoes.length} manut.
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
