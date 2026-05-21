import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { FileSignature, ChevronRight, Clock, FileText, CheckCircle2, XCircle } from 'lucide-react'

const statusInfo: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  PENDENTE: { bg: '#FEF3E2', text: '#633806', label: 'Pendente', icon: Clock },
  EM_CONTRATO: { bg: '#E3EEFA', text: '#1A5276', label: 'Em contrato', icon: FileText },
  CONCLUIDO: { bg: '#EAF3DE', text: '#27500A', label: 'Concluído', icon: CheckCircle2 },
  CANCELADO: { bg: '#FDEEEE', text: '#8B0000', label: 'Cancelado', icon: XCircle },
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

export default function Pedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')

  useEffect(() => {
    setLoading(true)
    const params: any = {}
    if (filtroStatus) params.status = filtroStatus
    api.get('/pedidos', { params })
      .then((r) => setPedidos(r.data))
      .finally(() => setLoading(false))
  }, [filtroStatus])

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 text-sm mt-1">{pedidos.length} pedido(s) — gerados automaticamente ao aprovar um orçamento</p>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="EM_CONTRATO">Em contrato</option>
          <option value="CONCLUIDO">Concluídos</option>
          <option value="CANCELADO">Cancelados</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum pedido encontrado</p>
          <p className="text-xs mt-1">Pedidos são gerados ao aprovar um orçamento</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {pedidos.map((p) => {
            const st = statusInfo[p.status] || statusInfo.PENDENTE
            const Icon = st.icon
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/pedidos/${p.id}`)}
                className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all animate-fade-in"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
                  <Icon className="w-5 h-5" style={{ color: '#FFAF06' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{p.numero}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.text }}>
                      {st.label}
                    </span>
                    {p.orcamento && <span className="text-xs text-gray-400">← {p.orcamento.numero}</span>}
                    {p.contrato && <span className="text-xs text-gray-400">→ {p.contrato.numero}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <span className="font-medium text-gray-700">{p.cliente?.razaoSocial}</span>
                    <span>Criado: {fmtDate(p.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-gray-900 text-sm">{fmt(Number(p.valor))}</div>
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
