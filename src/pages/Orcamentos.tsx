import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { FileText, Plus, ChevronRight, CheckCircle2, Send, XCircle, Clock } from 'lucide-react'

const statusInfo: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  RASCUNHO: { bg: '#F1EFE8', text: '#888', label: 'Rascunho', icon: FileText },
  ENVIADO: { bg: '#E3EEFA', text: '#1A5276', label: 'Enviado', icon: Send },
  APROVADO: { bg: '#EAF3DE', text: '#27500A', label: 'Aprovado', icon: CheckCircle2 },
  RECUSADO: { bg: '#FDEEEE', text: '#8B0000', label: 'Recusado', icon: XCircle },
  EXPIRADO: { bg: '#F1EFE8', text: '#888', label: 'Expirado', icon: Clock },
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

export default function Orcamentos() {
  const navigate = useNavigate()
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')

  const load = () => {
    setLoading(true)
    const params: any = {}
    if (filtroStatus) params.status = filtroStatus
    api.get('/orcamentos', { params })
      .then((r) => setOrcamentos(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroStatus])

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 text-sm mt-1">{orcamentos.length} orçamento(s) — envie ao cliente e aprove pra gerar pedido + contrato</p>
        </div>
        <button
          onClick={() => navigate('/orcamentos/novo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" />
          Novo orçamento
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
          <option value="RASCUNHO">Rascunhos</option>
          <option value="ENVIADO">Enviados</option>
          <option value="APROVADO">Aprovados</option>
          <option value="RECUSADO">Recusados</option>
          <option value="EXPIRADO">Expirados</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum orçamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {orcamentos.map((o) => {
            const st = statusInfo[o.status] || statusInfo.RASCUNHO
            const Icon = st.icon
            return (
              <div
                key={o.id}
                onClick={() => navigate(`/orcamentos/${o.id}`)}
                className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all animate-fade-in"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
                  <Icon className="w-5 h-5" style={{ color: '#FFAF06' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{o.numero}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.text }}>
                      {st.label}
                    </span>
                    {o.pedido && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#EAF3DE', color: '#27500A' }}>
                        → {o.pedido.numero}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <span className="font-medium text-gray-700">{o.cliente?.razaoSocial}</span>
                    {o.descricao && <span className="truncate max-w-md">{o.descricao}</span>}
                    <span>Validade: {o.validade}d</span>
                    <span>Criado: {fmtDate(o.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-gray-900 text-sm">{fmt(Number(o.valorFinal))}</div>
                  {o.desconto && <div className="text-xs text-gray-400">-{Number(o.desconto)}%</div>}
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
