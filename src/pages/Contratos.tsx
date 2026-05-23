import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { FileText, Search, Plus, ChevronRight, AlertCircle } from 'lucide-react'

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  ATIVO: { bg: '#EAF3DE', text: '#27500A', label: 'Ativo' },
  VENCENDO: { bg: '#FEF3E2', text: '#633806', label: 'Vencendo' },
  RASCUNHO: { bg: '#F1EFE8', text: '#888', label: 'Rascunho' },
  AGUARDANDO_ASSINATURA: { bg: '#E3EEFA', text: '#1A5276', label: 'Aguard. assinatura' },
  ENCERRADO: { bg: '#F1EFE8', text: '#888', label: 'Encerrado' },
  RESCINDIDO: { bg: '#FDEEEE', text: '#8B0000', label: 'Rescindido' },
}

const tipoLabel: Record<string, string> = {
  CONTAINER_SECO: 'Container Seco',
  CONTAINER_REEFER: 'Container Reefer',
  CACAMBA_ESTACIONARIA: 'Caçamba Estacionária',
  CAMINHAO_MUNCK: 'Caminhão Munck',
  CAMINHAO_POLIGUINDASTE: 'Caminhão Poliguindaste',
  CAMINHAO_CAVALO_MECANICO: 'Caminhão Cavalo Mecânico',
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR')

export default function Contratos() {
  const navigate = useNavigate()
  const [contratos, setContratos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  useEffect(() => {
    api.get('/contratos').then((r) => setContratos(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = contratos.filter((c) => {
    const matchBusca = c.numero?.toLowerCase().includes(busca.toLowerCase()) ||
      c.cliente?.razaoSocial?.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = !filtroStatus || c.status === filtroStatus
    return matchBusca && matchStatus
  })

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-500 text-sm mt-1">{contratos.length} contratos no sistema</p>
        </div>
        <button
          onClick={() => navigate('/contratos/novo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" />
          Novo contrato
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número ou cliente..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl text-sm outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="VENCENDO">Vencendo</option>
          <option value="RASCUNHO">Rascunho</option>
          <option value="ENCERRADO">Encerrados</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum contrato encontrado</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {filtered.map((c) => {
            const status = statusColor[c.status] || statusColor.ATIVO
            const diasVenc = Math.ceil((new Date(c.dtFim).getTime() - Date.now()) / 86400000)
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/contratos/${c.id}`)}
                className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all animate-fade-in"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
                  <FileText className="w-5 h-5" style={{ color: '#FFAF06' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{c.numero}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: status.bg, color: status.text }}>
                      {status.label}
                    </span>
                    {diasVenc <= 30 && diasVenc > 0 && (
                      <span className="flex items-center gap-1 text-xs text-orange-600">
                        <AlertCircle className="w-3 h-3" />
                        {diasVenc}d restantes
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="font-medium text-gray-700">{c.cliente?.razaoSocial}</span>
                    <span>{tipoLabel[c.tipoModelo] || c.tipoModelo}</span>
                    <span className="hidden sm:block">{fmtDate(c.dtInicio)} → {fmtDate(c.dtFim)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-gray-900 text-sm">{fmt(c.valor)}</div>
                  <div className="text-gray-400 text-xs">{c.periodicidade}</div>
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
