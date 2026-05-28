import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { Layers, Plus, MapPin, Calendar, AlertTriangle, Loader2, AlertCircle, X, Trash2, DollarSign, FileText, MoreVertical, RefreshCw, ArrowDownLeft } from 'lucide-react'
import { fmtDate } from '../utils/data'

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  PARA_MOBILIZAR:         { bg: '#FFF3D6', text: '#A77400', label: 'Para mobilizar' },
  EM_ROTA_MOBILIZACAO:    { bg: '#E3EEFA', text: '#1A5276', label: 'Em rota (mobilização)' },
  // Aliases de Logística (caso backend mande o raw em vez do mapeado)
  EM_ROTA:                { bg: '#E3EEFA', text: '#1A5276', label: 'Em rota (mobilização)' },
  ATIVA:                  { bg: '#EAF3DE', text: '#27500A', label: 'Mobilizada' },
  MOBILIZADO:             { bg: '#EAF3DE', text: '#27500A', label: 'Mobilizada' },
  // CHEIA foi unificado em PARA_DESMOBILIZAR — registros antigos seguem aparecendo até a migração rodar
  CHEIA:                  { bg: '#FDEEEE', text: '#8B0000', label: 'Para desmobilizar' },
  PARA_DESMOBILIZAR:      { bg: '#FDEEEE', text: '#8B0000', label: 'Para desmobilizar' },
  EM_ROTA_DESMOBILIZACAO: { bg: '#F4E3FA', text: '#5B1A76', label: 'Em rota (desmob/troca)' },
  EM_ROTA_DESMOBILIZAR:   { bg: '#F4E3FA', text: '#5B1A76', label: 'Em rota (desmob/troca)' },
  ENCERRADA:              { bg: '#F1EFE8', text: '#888',    label: 'Encerrada' },
  DESMOBILIZADO:          { bg: '#F1EFE8', text: '#888',    label: 'Encerrada' },
}

// Filtros visíveis na barra de status — ENCERRADA fica fora (vai pra "Arquivadas")
const STATUS_ORDEM = [
  'PARA_MOBILIZAR',
  'EM_ROTA_MOBILIZACAO',
  'ATIVA',
  'PARA_DESMOBILIZAR',
  'EM_ROTA_DESMOBILIZACAO',
]
const STATUS_ARQUIVADOS = ['ENCERRADA', 'DESMOBILIZADO']


/** Cor de urgência baseada em dias até retirada */
function corContagem(dias: number): { bg: string; text: string; label: string; icon: string } {
  const palavra = (n: number) => (n === 1 ? 'dia' : 'dias')
  if (dias < 0) {
    const d = Math.abs(dias)
    return { bg: '#FDEEEE', text: '#8B0000', label: `Vencida há ${d} ${palavra(d)}`, icon: '⚠' }
  }
  if (dias === 0) {
    return { bg: '#FDEEEE', text: '#8B0000', label: 'Vence hoje', icon: '⏰' }
  }
  if (dias <= 3) {
    return { bg: '#FEF3E2', text: '#633806', label: `${dias} ${palavra(dias)} pra retirada`, icon: '⏳' }
  }
  if (dias <= 7) {
    return { bg: '#FFF8E6', text: '#A77400', label: `${dias} ${palavra(dias)} pra retirada`, icon: '⏳' }
  }
  return { bg: '#EAF3DE', text: '#27500A', label: `${dias} ${palavra(dias)} pra retirada`, icon: '⏳' }
}

export default function Cacambas() {
  const navigate = useNavigate()
  const [locacoes, setLocacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('') // '' = ativas; 'ARQUIVADAS' = encerradas
  const [verArquivadas, setVerArquivadas] = useState(false)
  const [trocaModal, setTrocaModal] = useState<any>(null)
  const [showFechamento, setShowFechamento] = useState(false)
  const [contagens, setContagens] = useState<Record<string, number>>({})
  const [kebabOpen, setKebabOpen] = useState<string | null>(null)
  const [renovarModal, setRenovarModal] = useState<any>(null) // { locacao, contrato, dtFim, valor, observacoes }
  const [solicitarTrocaModal, setSolicitarTrocaModal] = useState<any>(null) // locação MOBILIZADA pra solicitar troca
  const [logisticaPendente, setLogisticaPendente] = useState<any[]>([])

  const loadParaMobilizar = async () => {
    const tiposCacamba = ['CACAMBA', 'CACAMBA_ESTACIONARIA']
    try {
      // 1 chamada só com CSV (antes eram 4 paralelas)
      const r = await api.get('/logistica', {
        params: { status: 'PARA_MOBILIZAR,EM_ROTA,PARA_DESMOBILIZAR,EM_ROTA_DESMOBILIZAR' },
      }).catch(() => ({ data: [] }))
      const filtrados = (r.data || []).filter((it: any) => {
        if (!tiposCacamba.includes(it.equipamento?.tipo)) return false
        if (it.status === 'PARA_MOBILIZAR') return !!it.autorizadoEm
        return true
      })
      setLogisticaPendente(filtrados)
    } catch {}
  }

  const load = () => {
    setLoading(true)
    const params: any = {}
    if (filtroStatus) params.status = filtroStatus
    Promise.all([
      api.get('/cacambas/locacoes', { params }),
      api.get('/cacambas/locacoes/resumo'),
      // Carrega "em movimentação" no mesmo Promise.all pra paralelizar
      loadParaMobilizar(),
    ])
      .then(([list, res]) => {
        const raw: any[] = list.data || []
        const filtradas = verArquivadas
          ? raw.filter((l) => STATUS_ARQUIVADOS.includes(l.status))
          : (filtroStatus ? raw : raw.filter((l) => !STATUS_ARQUIVADOS.includes(l.status)))
        setLocacoes(filtradas)
        const map: Record<string, number> = {}
        for (const r of res.data || []) map[r.status] = r._count?._all ?? 0
        setContagens(map)
      })
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroStatus, verArquivadas])

  // Fecha o kebab ao clicar fora
  useEffect(() => {
    if (!kebabOpen) return
    const handler = () => setKebabOpen(null)
    setTimeout(() => document.addEventListener('click', handler), 0)
    return () => document.removeEventListener('click', handler)
  }, [kebabOpen])

  const totalGeral = Object.values(contagens).reduce((a, b) => a + b, 0)

  const [erroAcao, setErroAcao] = useState('')

  const encerrar = async (id: string) => {
    if (!confirm('Encerrar esta locação? A caçamba ficará disponível novamente.')) return
    await api.put(`/cacambas/locacoes/${id}/encerrar`)
    load()
  }

  // Abre modal de renovação de contrato (Troca → Renovação)
  const abrirRenovacao = async (l: any) => {
    setKebabOpen(null)
    if (!l.contrato?.id) return
    setErroAcao('')
    try {
      const { data: c } = await api.get(`/contratos/${l.contrato.id}`)
      // Default: novaDtFim = dtFim atual + 30 dias
      const atual = new Date(c.dtFim)
      atual.setDate(atual.getDate() + 30)
      const novaDtFimDefault = atual.toISOString().slice(0, 10)
      setRenovarModal({
        locacao: l,
        contrato: c,
        novaDtFim: novaDtFimDefault,
        novoValor: String(Number(c.valor).toFixed(2)),
        observacoes: '',
        salvando: false,
      })
    } catch (err: any) {
      setErroAcao(err.response?.data?.message || 'Erro ao carregar contrato.')
    }
  }

  const salvarRenovacao = async () => {
    if (!renovarModal) return
    setRenovarModal((r: any) => ({ ...r, salvando: true }))
    try {
      await api.post(`/contratos/${renovarModal.contrato.id}/renovar`, {
        novaDtFim: renovarModal.novaDtFim,
        novoValor: Number(renovarModal.novoValor),
        observacoes: renovarModal.observacoes || undefined,
      })
      setRenovarModal(null)
      load()
    } catch (err: any) {
      setErroAcao(err.response?.data?.message || 'Erro ao renovar contrato.')
      setRenovarModal((r: any) => ({ ...r, salvando: false }))
    }
  }

  // Retirada → encerra contrato (caçamba se ajusta via módulo logística)
  const encerrarContrato = async (l: any) => {
    setKebabOpen(null)
    if (!l.contrato?.id) return
    if (!confirm(
      `Encerrar o contrato ${l.contrato.numero}?\n\n` +
      `Isso encerra o contrato e libera a caçamba ${l.cacamba?.codigo}. ` +
      `Esta ação não pode ser desfeita.`
    )) return
    setErroAcao('')
    try {
      await api.put(`/contratos/${l.contrato.id}/status`, { status: 'ENCERRADO' })
      load()
    } catch (err: any) {
      setErroAcao(err.response?.data?.message || 'Erro ao encerrar contrato.')
    }
  }

  const mudarStatus = async (id: string, novoStatus: string, origem?: string) => {
    setErroAcao('')
    if (origem === 'LOGISTICA') {
      setErroAcao(
        'Esta caçamba veio de um contrato (módulo Logística). Mude o status lá: ' +
        'mobilize/desmobilize pelas abas correspondentes.'
      )
      return
    }
    try {
      await api.put(`/cacambas/locacoes/${id}/status`, { status: novoStatus })
      load()
    } catch (err: any) {
      setErroAcao(err.response?.data?.message || 'Erro ao mudar status.')
    }
  }

  const excluir = async (l: any) => {
    if (!confirm(`Excluir esta locação de ${l.cliente?.razaoSocial}? Esta ação não pode ser desfeita.`)) return
    setErroAcao('')
    try {
      await api.delete(`/cacambas/locacoes/${l.id}`)
      load()
    } catch (err: any) {
      const msg = err.response?.data?.message || ''
      // se foi bloqueado por trocas, oferece exclusão forçada (cascade)
      if (/troca/i.test(msg)) {
        if (!confirm(`${msg}\n\nDeseja FORÇAR a exclusão? Vai apagar a locação, todas as trocas e as destinações de resíduos. Histórico será perdido.`)) {
          setErroAcao('Exclusão cancelada.')
          return
        }
        try {
          await api.delete(`/cacambas/locacoes/${l.id}?force=true`)
          load()
        } catch (err2: any) {
          setErroAcao(err2.response?.data?.message || 'Erro ao forçar exclusão.')
        }
      } else {
        setErroAcao(msg || 'Erro ao excluir locação.')
      }
    }
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Caçambas</h1>
          <p className="text-gray-500 text-sm mt-1">Locações, trocas e rastreabilidade de resíduos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFechamento(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all"
            style={{ background: '#27AE60' }}
            title="Gerar 1 fatura única com todas as trocas de um cliente num período"
          >
            <DollarSign className="w-4 h-4" />
            Fechar conta
          </button>
          <button
            onClick={() => navigate('/cacambas/nova')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
            style={{ background: '#FFAF06' }}
          >
            <Plus className="w-4 h-4" />
            Nova locação
          </button>
        </div>
      </div>

      {/* Caçambas em movimentação — duas colunas sempre visíveis: Para mobilizar | Para desmobilizar */}
      {(() => {
        const statusVisual: Record<string, { dot: string; bg: string; text: string; label: string }> = {
          PARA_MOBILIZAR:       { dot: '#FFAF06', bg: '#FEF3E2', text: '#633806', label: 'Aguardando motorista' },
          EM_ROTA:              { dot: '#1A5276', bg: '#E3EEFA', text: '#1A5276', label: 'Em rota' },
          PARA_DESMOBILIZAR:    { dot: '#8B0000', bg: '#FDEEEE', text: '#8B0000', label: 'Aguardando motorista' },
          EM_ROTA_DESMOBILIZAR: { dot: '#1A5276', bg: '#E3EEFA', text: '#1A5276', label: 'Em rota' },
        }
        const mobilizando = logisticaPendente.filter((it) => it.status === 'PARA_MOBILIZAR' || it.status === 'EM_ROTA')
        const desmobilizando = logisticaPendente.filter((it) => it.status === 'PARA_DESMOBILIZAR' || it.status === 'EM_ROTA_DESMOBILIZAR')

        const renderCard = (it: any) => {
          const sv = statusVisual[it.status] || statusVisual.PARA_MOBILIZAR
          return (
            <div
              key={it.id}
              onClick={() => navigate('/logistica')}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50"
              style={{ background: '#FAFAF8', border: '1px solid #F1EFE8' }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: sv.dot }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {it.equipamento?.codigo} · {it.contrato?.cliente?.razaoSocial || it.contrato?.numero || '—'}
                </div>
                <div className="text-xs text-gray-500 truncate">{it.enderecoEntrega || 'Sem endereço'}</div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: sv.bg, color: sv.text }}>
                {sv.label}
              </span>
            </div>
          )
        }

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Coluna Para mobilizar */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #FEF3E2' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#FFAF06' }} />
                  <h2 className="font-semibold text-gray-900 text-sm">Para mobilizar ({mobilizando.length})</h2>
                </div>
                <button onClick={() => navigate('/logistica')} className="text-xs font-medium text-gray-600 hover:text-gray-900">
                  Logística →
                </button>
              </div>
              {mobilizando.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-6">Nenhuma caçamba pra mobilizar</div>
              ) : (
                <div className="space-y-2">{mobilizando.map(renderCard)}</div>
              )}
            </div>

            {/* Coluna Para desmobilizar */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #FDEEEE' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#8B0000' }} />
                  <h2 className="font-semibold text-gray-900 text-sm">Para desmobilizar ({desmobilizando.length})</h2>
                </div>
                <button onClick={() => navigate('/logistica')} className="text-xs font-medium text-gray-600 hover:text-gray-900">
                  Logística →
                </button>
              </div>
              {desmobilizando.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-6">Nenhuma caçamba pra desmobilizar</div>
              ) : (
                <div className="space-y-2">{desmobilizando.map(renderCard)}</div>
              )}
            </div>
          </div>
        )
      })()}

      <div className="flex gap-2 mb-6 flex-wrap items-center">
        {[{ key: '', label: 'Todas', count: (totalGeral - STATUS_ARQUIVADOS.reduce((s, k) => s + (contagens[k] || 0), 0)), bg: '#F1EFE8', text: '#666', activeBg: '#1A1C1E' },
          ...STATUS_ORDEM.map((s) => {
            const info = statusColor[s]
            return { key: s, label: info.label, count: contagens[s] || 0, bg: info.bg, text: info.text, activeBg: info.text }
          })].map((t) => {
          const ativo = filtroStatus === t.key && !verArquivadas
          return (
            <button
              key={t.key || 'all'}
              onClick={() => { setVerArquivadas(false); setFiltroStatus(t.key) }}
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
        <div className="flex-1" />
        <button
          onClick={() => { setFiltroStatus(''); setVerArquivadas(!verArquivadas) }}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          style={{ background: verArquivadas ? '#1A1C1E' : 'transparent', color: verArquivadas ? 'white' : '#666', border: verArquivadas ? 'none' : '1px solid #E0DDD8' }}
          title="Mostrar caçambas encerradas/desmobilizadas"
        >
          {verArquivadas ? '← Voltar pras ativas' : 'Histórico arquivado'}
          <span
            className="px-1.5 py-0.5 rounded-md text-[11px] font-semibold"
            style={{
              background: verArquivadas ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
              color: verArquivadas ? 'white' : '#666',
              minWidth: 22, textAlign: 'center',
            }}
          >
            {STATUS_ARQUIVADOS.reduce((s, k) => s + (contagens[k] || 0), 0)}
          </span>
        </button>
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
      ) : locacoes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma locação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {locacoes.map((l) => {
            const status = statusColor[l.status] || statusColor.PARA_MOBILIZAR
            const diasVenc = Math.ceil((new Date(l.dtVencimento).getTime() - Date.now()) / 86400000)
            const vencida = diasVenc < 0
            return (
              <div key={l.id} className="bg-white rounded-2xl p-5 animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: '#FFFFFF', border: '1px solid #E0DDD8' }}
                  >
                    <img src="/icones/cacamba.png" alt="caçamba" className="w-9 h-9 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{l.cacamba?.codigo}</span>
                      <span className="text-sm text-gray-700">{l.cliente?.razaoSocial}</span>
                      <select
                        value={l.status}
                        onChange={(e) => mudarStatus(l.id, e.target.value, l._origem)}
                        title="Mudar status manualmente"
                        className="px-2 py-0.5 rounded-full text-xs font-medium outline-none cursor-pointer"
                        style={{ background: status.bg, color: status.text, border: 'none' }}
                      >
                        {STATUS_ORDEM.map((s) => (
                          <option key={s} value={s}>{statusColor[s].label}</option>
                        ))}
                      </select>
                      {l._origem === 'LOGISTICA' && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: '#E3EEFA', color: '#1A5276' }}
                          title={`Vem do contrato ${l.contrato?.numero} via módulo Logística`}
                        >
                          Contrato {l.contrato?.numero}
                        </span>
                      )}
                      {l.status !== 'ENCERRADA' && l.dtVencimento && (() => {
                        const c = corContagem(diasVenc)
                        return (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1"
                            style={{ background: c.bg, color: c.text }}
                            title={`Vencimento: ${fmtDate(l.dtVencimento)}`}
                          >
                            <span>{c.icon}</span> {c.label}
                          </span>
                        )
                      })()}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {l.endEntrega}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Entrega: {fmtDate(l.dtEntrega)}</span>
                      {l._origem !== 'LOGISTICA' && <span>Venc: {fmtDate(l.dtVencimento)}</span>}
                      {l._origem !== 'LOGISTICA' && <span>Resíduo: {l.residuoAutorizado}</span>}
                      {l.volumePctAtual > 0 && <span>{l.volumePctAtual}% cheia</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t flex-wrap items-center" style={{ borderColor: '#F1EFE8' }}>
                  {l._origem === 'LOGISTICA' ? (
                    <>
                      <button
                        onClick={() => navigate('/logistica')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                        style={{ border: '1px solid #E0DDD8' }}
                      >
                        Gerenciar no módulo Logística →
                      </button>
                      {/* Menu de ações do contrato (... → Troca / Retirada) */}
                      <div className="relative ml-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setKebabOpen(kebabOpen === l.id ? null : l.id)}
                          title="Mais ações"
                          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {kebabOpen === l.id && (
                          <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg z-20 overflow-hidden" style={{ border: '1px solid #E0DDD8' }}>
                            <button
                              onClick={() => {
                                setKebabOpen(null)
                                setSolicitarTrocaModal(l)
                              }}
                              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <RefreshCw className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FFAF06' }} />
                              <div>
                                <div className="text-sm font-medium text-gray-900">Solicitar troca</div>
                                <div className="text-xs text-gray-500">Retira esta e deixa outra no cliente</div>
                              </div>
                            </button>
                            <div style={{ borderTop: '1px solid #F1EFE8' }} />
                            <button
                              onClick={() => abrirRenovacao(l)}
                              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <RefreshCw className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#888' }} />
                              <div>
                                <div className="text-sm font-medium text-gray-900">Renovar contrato</div>
                                <div className="text-xs text-gray-500">Novo período do contrato {l.contrato?.numero}</div>
                              </div>
                            </button>
                            <div style={{ borderTop: '1px solid #F1EFE8' }} />
                            <button
                              onClick={() => {
                                setKebabOpen(null)
                                // Vai pra Logística focado no item, abrindo o modal de atribuir desmob
                                navigate(`/logistica?focusDesmob=${l._logisticaId || l.id.replace(/^log:/, '')}`)
                              }}
                              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-amber-50 transition-colors"
                            >
                              <ArrowDownLeft className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FFAF06' }} />
                              <div>
                                <div className="text-sm font-medium text-gray-900">Solicitar desmobilização</div>
                                <div className="text-xs text-gray-500">Atribuir motorista pra retirar a caçamba</div>
                              </div>
                            </button>
                            <div style={{ borderTop: '1px solid #F1EFE8' }} />
                            <button
                              onClick={() => encerrarContrato(l)}
                              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors"
                            >
                              <X className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                              <div>
                                <div className="text-sm font-medium text-gray-900">Encerrar contrato</div>
                                <div className="text-xs text-gray-500">Finaliza o contrato {l.contrato?.numero}</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    l.status !== 'ENCERRADA' && (
                      <>
                        <button
                          onClick={() => setTrocaModal(l)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: '#FFF8E6', color: '#FFAF06' }}
                        >
                          Registrar troca
                        </button>
                        <button
                          onClick={() => encerrar(l.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                          style={{ border: '1px solid #E0DDD8' }}
                        >
                          Encerrar locação
                        </button>
                      </>
                    )
                  )}
                  {l._origem !== 'LOGISTICA' && (
                  <button
                    onClick={() => excluir(l)}
                    title="Excluir locação (bloqueado se houver trocas)"
                    className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50"
                    style={{ border: '1px solid #FACACA' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {trocaModal && (
        <TrocaModal locacao={trocaModal} onClose={() => setTrocaModal(null)} onSuccess={() => { setTrocaModal(null); load() }} />
      )}

      {solicitarTrocaModal && (
        <SolicitarTrocaModal
          locacao={solicitarTrocaModal}
          onClose={() => setSolicitarTrocaModal(null)}
          onSuccess={() => { setSolicitarTrocaModal(null); load(); loadParaMobilizar() }}
          onErro={setErroAcao}
        />
      )}

      {renovarModal && (
        <Modal onClose={() => setRenovarModal(null)}>
          <div className="p-6">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-1">Renovar contrato {renovarModal.contrato.numero}</h2>
            <p className="text-sm text-gray-500 mb-5">Estende o prazo e cria um registro de renovação no histórico.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Nova data de término</label>
                <input
                  type="date"
                  value={renovarModal.novaDtFim}
                  onChange={(e) => setRenovarModal((r: any) => ({ ...r, novaDtFim: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#FAFAFA', border: '1.5px solid #E8E5E0' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Novo valor (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={renovarModal.novoValor}
                  onChange={(e) => setRenovarModal((r: any) => ({ ...r, novoValor: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#FAFAFA', border: '1.5px solid #E8E5E0' }}
                />
                <p className="text-xs text-gray-400 mt-1">Mantenha o valor atual se não tiver reajuste.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Observações (opcional)</label>
                <textarea
                  rows={2}
                  value={renovarModal.observacoes}
                  onChange={(e) => setRenovarModal((r: any) => ({ ...r, observacoes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: '#FAFAFA', border: '1.5px solid #E8E5E0' }}
                  placeholder="Ex: troca de caçamba na obra X, reajuste IPCA, etc."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button
                onClick={() => setRenovarModal(null)}
                disabled={renovarModal.salvando}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                style={{ border: '1px solid #E0DDD8' }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarRenovacao}
                disabled={renovarModal.salvando || !renovarModal.novaDtFim || !renovarModal.novoValor}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-900 disabled:opacity-50 flex items-center gap-2"
                style={{ background: '#FFAF06' }}
              >
                {renovarModal.salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                Renovar contrato
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showFechamento && (
        <FechamentoModal
          onClose={() => setShowFechamento(false)}
          onSuccess={() => { setShowFechamento(false); load() }}
        />
      )}
    </div>
  )
}

function TrocaModal({ locacao, onClose, onSuccess }: { locacao: any; onClose: () => void; onSuccess: () => void }) {
  const [cacambasDisp, setCacambasDisp] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    cacambaEntId: '',
    cacambaRetId: locacao.cacambaId || '',
    volumeM3: '',
    tipoResiduo: locacao.residuoAutorizado || '',
    observacoes: '',
    destinoLocal: '',
    destinoTipoArea: 'ATERRO_LICENCIADO',
    destinoMTR: '',
  })

  useEffect(() => {
    api.get('/equipamentos', { params: { tipo: 'CACAMBA_ESTACIONARIA', status: 'DISPONIVEL' } })
      .then((r) => setCacambasDisp(r.data))
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.cacambaEntId) return setErro('Selecione a caçamba que será entregue.')
    setLoading(true)
    try {
      await api.post(`/cacambas/locacoes/${locacao.id}/troca`, {
        cacambaEntId: form.cacambaEntId,
        cacambaRetId: form.cacambaRetId,
        volumeM3: form.volumeM3 ? Number(form.volumeM3) : null,
        tipoResiduo: form.tipoResiduo,
        observacoes: form.observacoes || null,
        destinacao: form.destinoLocal ? {
          localDestino: form.destinoLocal,
          tipoArea: form.destinoTipoArea,
          volumeM3: form.volumeM3 ? Number(form.volumeM3) : null,
          numeroMTR: form.destinoMTR || null,
        } : undefined,
      })
      onSuccess()
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao registrar troca.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">Registrar troca</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Cliente: {locacao.cliente?.razaoSocial} • Caçamba atual: {locacao.cacamba?.codigo}</p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Caçamba nova (a entregar) *</label>
            <select value={form.cacambaEntId} onChange={(e) => setForm({ ...form, cacambaEntId: e.target.value })} required className={inputCls} style={inputStyle}>
              <option value="">Selecione</option>
              {cacambasDisp.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.modelo}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Volume retirado (m³)</label>
              <input type="number" step="0.01" min="0" value={form.volumeM3} onChange={(e) => setForm({ ...form, volumeM3: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de resíduo</label>
              <input value={form.tipoResiduo} onChange={(e) => setForm({ ...form, tipoResiduo: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
          </div>

          <div className="pt-3 border-t" style={{ borderColor: '#F1EFE8' }}>
            <p className="text-xs font-medium text-gray-700 mb-2">Destinação do resíduo (opcional)</p>
            <div className="space-y-2">
              <input value={form.destinoLocal} onChange={(e) => setForm({ ...form, destinoLocal: e.target.value })} placeholder="Local de destino (ex: Aterro CDR Pernambuco)" className={inputCls} style={inputStyle} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.destinoTipoArea} onChange={(e) => setForm({ ...form, destinoTipoArea: e.target.value })} className={inputCls} style={inputStyle}>
                  <option value="ATERRO_LICENCIADO">Aterro licenciado</option>
                  <option value="ATR">Área de transbordo</option>
                  <option value="RECICLAGEM">Reciclagem</option>
                  <option value="REUTILIZACAO">Reutilização</option>
                </select>
                <input value={form.destinoMTR} onChange={(e) => setForm({ ...form, destinoMTR: e.target.value })} placeholder="Nº MTR (Sinir)" className={inputCls} style={inputStyle} />
              </div>
            </div>
          </div>

          <textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            placeholder="Observações..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
            style={inputStyle}
          />

          {erro && (<div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>)}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Registrar troca
            </button>
          </div>
        </form>
    </Modal>
  )
}

// ────────── Fechamento Modal ──────────
function FechamentoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [clientes, setClientes] = useState<any[]>([])
  const [clienteId, setClienteId] = useState('')
  const hoje = new Date()
  const seteDiasAtras = new Date(hoje); seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
  const [dtInicio, setDtInicio] = useState(seteDiasAtras.toISOString().slice(0, 10))
  const [dtFim, setDtFim] = useState(hoje.toISOString().slice(0, 10))
  const [dtVencimento, setDtVencimento] = useState(() => {
    const v = new Date(); v.setDate(v.getDate() + 7); return v.toISOString().slice(0, 10)
  })
  const [descricao, setDescricao] = useState('')
  const [preview, setPreview] = useState<any>(null)
  const [carregandoPreview, setCarregandoPreview] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.get('/clientes').then((r) => setClientes(r.data || []))
  }, [])

  // Recarrega preview quando muda filtros
  useEffect(() => {
    if (!clienteId || !dtInicio || !dtFim) {
      setPreview(null)
      return
    }
    setCarregandoPreview(true); setErro('')
    api.get('/cacambas/fechamento/preview', { params: { clienteId, dtInicio, dtFim } })
      .then((r) => setPreview(r.data))
      .catch((e) => setErro(e.response?.data?.message || 'Erro ao carregar preview'))
      .finally(() => setCarregandoPreview(false))
  }, [clienteId, dtInicio, dtFim])

  const fmtMoeda = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v)

  const fechar = async () => {
    if (!preview || preview.trocas.length === 0) return
    if (preview.totalSemValor > 0) {
      setErro(`${preview.totalSemValor} troca(s) sem valor cobrado. Edite o valorTroca na locação e tente de novo.`)
      return
    }
    if (!confirm(`Gerar 1 fatura única de ${fmtMoeda(preview.total)} (${preview.trocas.length} trocas) pra ${preview.cliente}?`)) return
    setSalvando(true); setErro('')
    try {
      const r = await api.post('/cacambas/fechamento', { clienteId, dtInicio, dtFim, descricao: descricao || undefined, dtVencimento })
      alert(`✓ Fatura criada: ${fmtMoeda(r.data.total)} pendente.`)
      onSuccess()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao gerar fatura')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5" style={{ color: '#27AE60' }} /> Fechar conta de caçambas
        </h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <p className="text-xs text-gray-500 mb-4">Soma todas as trocas não-faturadas do cliente no período num único lançamento.</p>

      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Cliente *</label>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white" style={{ border: '1px solid #E0DDD8' }}>
            <option value="">Selecione um cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.razaoSocial}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Período: início</label>
            <input type="date" value={dtInicio} onChange={(e) => setDtInicio(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white" style={{ border: '1px solid #E0DDD8' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Período: fim</label>
            <input type="date" value={dtFim} onChange={(e) => setDtFim(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white" style={{ border: '1px solid #E0DDD8' }} />
          </div>
        </div>
      </div>

      {erro && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
        </div>
      )}

      {carregandoPreview ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Carregando preview...
        </div>
      ) : preview && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4" style={{ border: '1px solid #E0DDD8' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900">
              {preview.trocas.length} troca(s) no período
            </span>
            <span className="text-lg font-bold text-green-700">{fmtMoeda(preview.total)}</span>
          </div>
          {preview.trocas.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma troca não-faturada encontrada nesse período pra esse cliente.</p>
          ) : (
            <>
              {preview.totalSemValor > 0 && (
                <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {preview.totalSemValor} troca(s) sem valor cobrado — defina valorTroca na locação correspondente.
                </p>
              )}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {preview.trocas.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white">
                    <span className="text-gray-700">
                      #{t.numerTroca} • {t.cacambaCodigo}
                      {t.cacambaEntCodigo && t.cacambaEntCodigo !== t.cacambaCodigo && ` → ${t.cacambaEntCodigo}`}
                      <span className="text-gray-400 ml-2">{new Date(t.dtTroca).toLocaleDateString('pt-BR')}</span>
                    </span>
                    <span className={t.valorCobrado != null ? 'font-medium text-gray-900' : 'text-red-600'}>
                      {t.valorCobrado != null ? fmtMoeda(t.valorCobrado) : 'sem valor'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {preview && preview.trocas.length > 0 && (
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Descrição da fatura (opcional)</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={`Fechamento ${preview.trocas.length} troca(s) caçamba (${new Date(preview.dtInicio).toLocaleDateString('pt-BR')} a ${new Date(preview.dtFim).toLocaleDateString('pt-BR')})`}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white"
              style={{ border: '1px solid #E0DDD8' }}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data de vencimento da fatura</label>
            <input type="date" value={dtVencimento} onChange={(e) => setDtVencimento(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white" style={{ border: '1px solid #E0DDD8' }} />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>
          Cancelar
        </button>
        <button
          onClick={fechar}
          disabled={salvando || !preview || preview.trocas.length === 0 || preview.totalSemValor > 0}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: salvando ? '#1E7B40' : '#27AE60' }}
        >
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Gerar fatura {preview && preview.total > 0 ? `(${fmtMoeda(preview.total)})` : ''}
        </button>
      </div>
    </Modal>
  )
}

// ── Modal: Solicitar troca de caçamba ───────────────────────────────────────
// Cria 1 Operação TROCA (DESMOB da antiga + MOB da nova) e atribui ao motorista.
function SolicitarTrocaModal({
  locacao,
  onClose,
  onSuccess,
  onErro,
}: {
  locacao: any
  onClose: () => void
  onSuccess: () => void
  onErro: (m: string) => void
}) {
  const logisticaItemId = locacao._logisticaId || (typeof locacao.id === 'string' ? locacao.id.replace(/^log:/, '') : locacao.id)

  const [motoristas, setMotoristas] = useState<any[]>([])
  const [caminhoes, setCaminhoes] = useState<any[]>([])
  const [cacambasDisponiveis, setCacambasDisponiveis] = useState<any[]>([])
  const [valorTroca, setValorTroca] = useState<number | null>(null)
  const [form, setForm] = useState({
    equipamentoNovoId: '',
    motoristaId: '',
    caminhaoId: '',
    dtAgendada: new Date().toISOString().slice(0, 10),
    horaAgendada: '08:00',
    observacoes: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const tipo = locacao.cacamba?.tipo || 'CACAMBA'
    const contratoId = locacao.contrato?.id
    Promise.all([
      api.get('/motoristas', { params: { ativo: 'true' } }),
      api.get('/caminhoes'),
      api.get('/equipamentos', { params: { tipo, status: 'DISPONIVEL' } }),
      contratoId ? api.get(`/contratos/${contratoId}`).then((r) => r.data) : Promise.resolve(null),
    ]).then(([m, c, eq, contrato]) => {
      setMotoristas(m.data || [])
      setCaminhoes(c.data || [])
      setCacambasDisponiveis(eq.data || [])
      setValorTroca(contrato?.valorTroca != null ? Number(contrato.valorTroca) : null)
    })
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.equipamentoNovoId) return onErro('Selecione a caçamba nova.')
    if (!form.motoristaId) return onErro('Selecione o motorista.')
    if (!form.dtAgendada) return onErro('Informe a data.')
    setLoading(true)
    try {
      await api.post(`/logistica/${logisticaItemId}/solicitar-troca`, {
        equipamentoNovoId: form.equipamentoNovoId,
        motoristaId: form.motoristaId,
        caminhaoId: form.caminhaoId || null,
        dtAgendada: form.dtAgendada,
        horaAgendada: form.horaAgendada || null,
        observacoes: form.observacoes || null,
      })
      onSuccess()
    } catch (err: any) {
      onErro(err.response?.data?.message || 'Erro ao solicitar troca')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">Solicitar troca de caçamba</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <div className="text-xs text-gray-600 mb-4 p-3 rounded-lg space-y-1" style={{ background: '#FEF3E2' }}>
        <div className="font-medium text-gray-900">{locacao.cacamba?.codigo} sai → caçamba nova entra</div>
        <div>Contrato {locacao.contrato?.numero} · {locacao.cliente?.razaoSocial}</div>
        {locacao.endEntrega && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {locacao.endEntrega}</div>}
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Caçamba nova (entra no cliente) *</label>
          <select
            value={form.equipamentoNovoId}
            onChange={(e) => setForm({ ...form, equipamentoNovoId: e.target.value })}
            className={inputCls}
            style={inputStyle}
            required
          >
            <option value="">Selecione…</option>
            {cacambasDisponiveis.map((eq: any) => (
              <option key={eq.id} value={eq.id}>{eq.codigo} · {eq.modelo} · {eq.capacidade}</option>
            ))}
          </select>
          {cacambasDisponiveis.length === 0 && (
            <div className="text-xs text-red-600 mt-1">Nenhuma caçamba do mesmo tipo disponível no pátio.</div>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Motorista *</label>
          <select
            value={form.motoristaId}
            onChange={(e) => setForm({ ...form, motoristaId: e.target.value })}
            className={inputCls}
            style={inputStyle}
            required
          >
            <option value="">Selecione…</option>
            {motoristas.map((m: any) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Caminhão (opcional)</label>
          <select
            value={form.caminhaoId}
            onChange={(e) => setForm({ ...form, caminhaoId: e.target.value })}
            className={inputCls}
            style={inputStyle}
          >
            <option value="">Sem caminhão definido</option>
            {caminhoes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.codigo} · {c.modelo}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data *</label>
            <input type="date" value={form.dtAgendada} onChange={(e) => setForm({ ...form, dtAgendada: e.target.value })} className={inputCls} style={inputStyle} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hora</label>
            <input type="time" value={form.horaAgendada} onChange={(e) => setForm({ ...form, horaAgendada: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Observações (opcional)</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            rows={2}
            placeholder="Instruções específicas pro motorista"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
            style={inputStyle}
          />
        </div>
        {valorTroca && valorTroca > 0 ? (
          <div className="text-xs p-3 rounded-lg flex items-center gap-2" style={{ background: '#FFF8E6', border: '1px solid #FFAF06', color: '#633806' }}>
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <span>Esta troca gera uma fatura de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTroca)}</strong> ao cliente (configurado no contrato).</span>
          </div>
        ) : (
          <div className="text-xs text-gray-500 p-3 rounded-lg" style={{ background: '#F1EFE8', border: '1px solid #E0DDD8' }}>
            Sem cobrança por troca (configurável em Editar contrato → valor por troca).
          </div>
        )}
        <div className="text-xs text-gray-500 p-3 rounded-lg" style={{ background: '#F1F8E9', border: '1px solid #C8E6C9' }}>
          O motorista vê 1 operação no app: retira a {locacao.cacamba?.codigo} e deixa a nova no mesmo endereço. Ao finalizar, o sistema fecha a antiga e ativa a nova no contrato automaticamente.
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading || cacambasDisponiveis.length === 0} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Solicitar troca
          </button>
        </div>
      </form>
    </Modal>
  )
}
