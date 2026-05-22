import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ClipboardList, Plus, ChevronRight, AlertCircle } from 'lucide-react'

const statusInfo: Record<string, { bg: string; text: string; label: string }> = {
  RASCUNHO: { bg: '#F1EFE8', text: '#888', label: 'Rascunho' },
  EM_ANDAMENTO: { bg: '#FFF3D6', text: '#A77400', label: 'Em andamento' },
  CONCLUIDA: { bg: '#EAF3DE', text: '#27500A', label: 'Concluída' },
  CANCELADA: { bg: '#FDEEEE', text: '#8B0000', label: 'Cancelada' },
}

const fmtDateTime = (d?: string) =>
  d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export default function OrdensServicoMunck() {
  const navigate = useNavigate()
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [erro, setErro] = useState('')

  const load = () => {
    setLoading(true)
    const params: any = {}
    if (filtroStatus) params.status = filtroStatus
    api
      .get('/ordens-servico/munck', { params })
      .then((r) => setItens(r.data))
      .catch((e) => setErro(e.response?.data?.message || 'Erro ao carregar OS'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroStatus])

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Ordens de Serviço — Munck</h1>
          <p className="text-gray-500 text-sm mt-1">{itens.length} OS — preencha no tablet em campo</p>
        </div>
        <button
          onClick={() => navigate('/ordens-servico/munck/nova')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" /> Nova OS
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos os status</option>
          <option value="RASCUNHO">Rascunho</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="CONCLUIDA">Concluída</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>

      {erro && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : itens.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma OS cadastrada ainda</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {itens.map((o) => {
            const st = statusInfo[o.status] || statusInfo.RASCUNHO
            return (
              <div
                key={o.id}
                onClick={() => navigate(`/ordens-servico/munck/${o.id}`)}
                className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md animate-fade-in"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
                  <ClipboardList className="w-5 h-5" style={{ color: '#FFAF06' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{o.numero}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.text }}>
                      {st.label}
                    </span>
                    {o.contrato && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#EAF3DE', color: '#27500A' }}>
                        ← {o.contrato.numero}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span className="font-medium text-gray-700">{o.cliente?.razaoSocial}</span>
                    {o.caminhao && <span>{o.caminhao.codigo} — {o.caminhao.placa}</span>}
                    {o.operador && <span>Operador: {o.operador.nome}</span>}
                    <span>{fmtDateTime(o.dtHora)}</span>
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
