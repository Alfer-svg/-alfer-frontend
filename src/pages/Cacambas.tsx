import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Layers, Plus, MapPin, Calendar, AlertTriangle, Loader2, AlertCircle, X } from 'lucide-react'

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  ATIVA: { bg: '#EAF3DE', text: '#27500A', label: 'Ativa' },
  CHEIA: { bg: '#FEF3E2', text: '#633806', label: 'Cheia' },
  ENCERRADA: { bg: '#F1EFE8', text: '#888', label: 'Encerrada' },
}

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

export default function Cacambas() {
  const navigate = useNavigate()
  const [locacoes, setLocacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [trocaModal, setTrocaModal] = useState<any>(null)

  const load = () => {
    setLoading(true)
    const params: any = {}
    if (filtroStatus) params.status = filtroStatus
    api.get('/cacambas/locacoes', { params }).then((r) => setLocacoes(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [filtroStatus])

  const encerrar = async (id: string) => {
    if (!confirm('Encerrar esta locação? A caçamba ficará disponível novamente.')) return
    await api.put(`/cacambas/locacoes/${id}/encerrar`)
    load()
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

      <div className="flex gap-3 mb-6">
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todas as locações</option>
          <option value="ATIVA">Ativas</option>
          <option value="CHEIA">Cheias</option>
          <option value="ENCERRADA">Encerradas</option>
        </select>
      </div>

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
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: status.bg, color: status.text }}>
                        {status.label}
                      </span>
                      {l.status !== 'ENCERRADA' && vencida && (
                        <span className="flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" /> Vencida há {Math.abs(diasVenc)}d
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {l.endEntrega}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Entrega: {fmtDate(l.dtEntrega)}</span>
                      <span>Venc: {fmtDate(l.dtVencimento)}</span>
                      <span>Resíduo: {l.residuoAutorizado}</span>
                      {l.volumePctAtual > 0 && <span>{l.volumePctAtual}% cheia</span>}
                    </div>
                  </div>
                </div>
                {l.status !== 'ENCERRADA' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#F1EFE8' }}>
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
                  </div>
                )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  )
}
