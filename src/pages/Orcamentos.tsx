import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { FileText, Plus, ChevronRight, CheckCircle2, Send, XCircle, Clock, Archive, Loader2, AlertCircle } from 'lucide-react'

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
  const [filtroArquivado, setFiltroArquivado] = useState('false')
  const [aprovando, setAprovando] = useState<string | null>(null)
  const [erroAcao, setErroAcao] = useState('')

  const aprovar = async (e: React.MouseEvent, o: any) => {
    e.stopPropagation()
    if (!confirm(`Aprovar o orçamento ${o.numero}? Vai gerar automaticamente um pedido + contrato (RASCUNHO) com base nele.`)) return
    setAprovando(o.id); setErroAcao('')
    try {
      const r = await api.post(`/orcamentos/${o.id}/aprovar`)
      load()
      if (r.data?.contratoId) {
        if (confirm(`Aprovado! Pedido ${r.data.pedido?.numero} criado. Abrir o contrato pra finalizar o cadastro?`)) {
          navigate(`/contratos/${r.data.contratoId}`)
        }
      }
    } catch (err: any) {
      setErroAcao(err.response?.data?.message || 'Erro ao aprovar')
    } finally {
      setAprovando(null)
    }
  }

  const [contagens, setContagens] = useState<Record<string, number>>({})

  const load = () => {
    setLoading(true)
    const params: any = { arquivado: filtroArquivado }
    if (filtroStatus) params.status = filtroStatus
    Promise.all([
      api.get('/orcamentos', { params }),
      api.get('/orcamentos/resumo'),
    ])
      .then(([list, res]) => {
        setOrcamentos(list.data)
        const map: Record<string, number> = {}
        for (const r of res.data || []) map[r.status] = r._count?._all ?? 0
        setContagens(map)
      })
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroStatus, filtroArquivado])

  const totalGeral = Object.values(contagens).reduce((a, b) => a + b, 0)

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

      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { key: '', label: 'Todos', count: totalGeral, bg: '#F1EFE8', text: '#666', activeBg: '#1A1C1E' },
          { key: 'RASCUNHO', label: 'Rascunhos', count: contagens.RASCUNHO || 0, bg: '#F1EFE8', text: '#888', activeBg: '#888' },
          { key: 'ENVIADO', label: 'Enviados', count: contagens.ENVIADO || 0, bg: '#E3EEFA', text: '#1A5276', activeBg: '#1A5276' },
          { key: 'APROVADO', label: 'Aprovados', count: contagens.APROVADO || 0, bg: '#EAF3DE', text: '#27500A', activeBg: '#27500A' },
          { key: 'RECUSADO', label: 'Recusados', count: contagens.RECUSADO || 0, bg: '#FDEEEE', text: '#8B0000', activeBg: '#8B0000' },
          { key: 'EXPIRADO', label: 'Expirados', count: contagens.EXPIRADO || 0, bg: '#F1EFE8', text: '#888', activeBg: '#888' },
        ].map((t) => {
          const ativo = filtroStatus === t.key
          return (
            <button
              key={t.key || 'all'}
              onClick={() => setFiltroStatus(t.key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
              style={{ background: ativo ? t.activeBg : t.bg, color: ativo ? 'white' : t.text }}
            >
              {t.label}
              <span
                className="px-1.5 py-0.5 rounded-md text-[11px] font-semibold"
                style={{
                  background: ativo ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                  color: ativo ? 'white' : t.text,
                  minWidth: 22, textAlign: 'center',
                }}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex gap-3 mb-6">
        <select
          value={filtroArquivado}
          onChange={(e) => setFiltroArquivado(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="false">Ativos (não arquivados)</option>
          <option value="true">Apenas arquivados</option>
          <option value="all">Todos (com arquivados)</option>
        </select>
      </div>

      {erroAcao && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erroAcao}
        </div>
      )}

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
                    {o.arquivado && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F1EFE8', color: '#888' }}>
                        <Archive className="w-3 h-3" /> Arquivado
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
                {(o.status === 'RASCUNHO' || o.status === 'ENVIADO') && !o.pedido && (
                  <button
                    onClick={(e) => aprovar(e, o)}
                    disabled={aprovando === o.id}
                    title="Aprovar e gerar pedido + contrato"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50 flex-shrink-0"
                    style={{ background: '#27AE60' }}
                  >
                    {aprovando === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Aprovar
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
