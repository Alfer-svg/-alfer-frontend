import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { Layers, Plus, MapPin, Calendar, AlertTriangle, Loader2, AlertCircle, X, Trash2 } from 'lucide-react'

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  PARA_MOBILIZAR:         { bg: '#FFF3D6', text: '#A77400', label: 'Para mobilizar' },
  EM_ROTA_MOBILIZACAO:    { bg: '#E3EEFA', text: '#1A5276', label: 'Em rota (mobilização)' },
  ATIVA:                  { bg: '#EAF3DE', text: '#27500A', label: 'Mobilizada' },
  CHEIA:                  { bg: '#FEF3E2', text: '#633806', label: 'Cheia' },
  PARA_DESMOBILIZAR:      { bg: '#FDEEEE', text: '#8B0000', label: 'Para desmobilizar' },
  EM_ROTA_DESMOBILIZACAO: { bg: '#F4E3FA', text: '#5B1A76', label: 'Em rota (desmob/troca)' },
  ENCERRADA:              { bg: '#F1EFE8', text: '#888',    label: 'Encerrada' },
}

const STATUS_ORDEM = [
  'PARA_MOBILIZAR',
  'EM_ROTA_MOBILIZACAO',
  'ATIVA',
  'CHEIA',
  'PARA_DESMOBILIZAR',
  'EM_ROTA_DESMOBILIZACAO',
  'ENCERRADA',
]

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

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
  const [filtroStatus, setFiltroStatus] = useState('')
  const [trocaModal, setTrocaModal] = useState<any>(null)
  const [contagens, setContagens] = useState<Record<string, number>>({})

  const load = () => {
    setLoading(true)
    const params: any = {}
    if (filtroStatus) params.status = filtroStatus
    Promise.all([
      api.get('/cacambas/locacoes', { params }),
      api.get('/cacambas/locacoes/resumo'),
    ])
      .then(([list, res]) => {
        setLocacoes(list.data)
        const map: Record<string, number> = {}
        for (const r of res.data || []) map[r.status] = r._count?._all ?? 0
        setContagens(map)
      })
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroStatus])

  const totalGeral = Object.values(contagens).reduce((a, b) => a + b, 0)

  const [erroAcao, setErroAcao] = useState('')

  const encerrar = async (id: string) => {
    if (!confirm('Encerrar esta locação? A caçamba ficará disponível novamente.')) return
    await api.put(`/cacambas/locacoes/${id}/encerrar`)
    load()
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
        <button
          onClick={() => navigate('/cacambas/nova')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" />
          Nova locação
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ key: '', label: 'Todas', count: totalGeral, bg: '#F1EFE8', text: '#666', activeBg: '#1A1C1E' },
          ...STATUS_ORDEM.map((s) => {
            const info = statusColor[s]
            return { key: s, label: info.label, count: contagens[s] || 0, bg: info.bg, text: info.text, activeBg: info.text }
          })].map((t) => {
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
            const status = statusColor[l.status] || statusColor.ATIVA
            const diasVenc = Math.ceil((new Date(l.dtVencimento).getTime() - Date.now()) / 86400000)
            const vencida = diasVenc < 0
            return (
              <div key={l.id} className="bg-white rounded-2xl p-5 animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
                    <Layers className="w-5 h-5" style={{ color: '#FFAF06' }} />
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
                <div className="flex gap-2 mt-4 pt-4 border-t flex-wrap" style={{ borderColor: '#F1EFE8' }}>
                  {l._origem === 'LOGISTICA' ? (
                    <button
                      onClick={() => navigate('/logistica')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                      style={{ border: '1px solid #E0DDD8' }}
                    >
                      Gerenciar no módulo Logística →
                    </button>
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
