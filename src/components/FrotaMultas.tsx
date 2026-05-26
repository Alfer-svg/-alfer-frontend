import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from './Modal'
import { AlertOctagon, Plus, AlertCircle, Loader2, X, Pencil, Trash2 } from 'lucide-react'
import { fmtDate } from '../utils/data'

const STATUS_OPTS = [
  { v: 'PENDENTE', l: 'Pendente', bg: '#FEF3E2', text: '#633806' },
  { v: 'EM_RECURSO', l: 'Em recurso', bg: '#E3EEFA', text: '#1A5276' },
  { v: 'PAGA', l: 'Paga', bg: '#EAF3DE', text: '#27500A' },
  { v: 'CANCELADA', l: 'Cancelada', bg: '#F1EFE8', text: '#888' },
  { v: 'JUDICIALIZADA', l: 'Judicializada', bg: '#FDEEEE', text: '#8B0000' },
]

const GRAVIDADES = [
  { v: '', l: '—' },
  { v: 'LEVE', l: 'Leve (3 pts)' },
  { v: 'MEDIA', l: 'Média (4 pts)' },
  { v: 'GRAVE', l: 'Grave (5 pts)' },
  { v: 'GRAVISSIMA', l: 'Gravíssima (7 pts)' },
]

const PONTOS_PADRAO: Record<string, number> = { LEVE: 3, MEDIA: 4, GRAVE: 5, GRAVISSIMA: 7 }

const fmtBRL = (v?: number | null) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function FrotaMultas({ caminhaoId }: { caminhaoId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<any | null>(null)
  const [erro, setErro] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get(`/frota/caminhoes/${caminhaoId}/multas`),
      api.get(`/frota/caminhoes/${caminhaoId}/multas/stats`),
    ])
      .then(([r1, r2]) => { setItems(r1.data); setStats(r2.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [caminhaoId])

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta multa?')) return
    try {
      await api.delete(`/frota/multas/${id}`)
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao excluir')
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4" /> Multas / Infrações
        </h2>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: '#FFF8E6', color: '#FFAF06' }}
        >
          <Plus className="w-3 h-3" /> Registrar
        </button>
      </div>

      {erro && (
        <div className="p-3 mb-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE' }}>
          <AlertCircle className="w-4 h-4" /> {erro}
        </div>
      )}

      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <StatCard label="Pendentes" value={String(stats.pendentes)} sub={fmtBRL(stats.pendenteValor)} highlight={stats.pendentes > 0} cor="#8B0000" />
          <StatCard label="Pagas" value={String(stats.pagas)} sub={fmtBRL(stats.totalPago)} />
          <StatCard label="Pontos no ano" value={String(stats.pontosAno)} sub={`${stats.valorAno > 0 ? fmtBRL(stats.valorAno) : '—'} em multas`} highlight={stats.pontosAno >= 14} cor="#8B0000" />
          <StatCard label="Total registrado" value={String(stats.total)} sub={fmtBRL(stats.totalValor)} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin inline" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhuma multa registrada. 🎉</p>
      ) : (
        <div className="space-y-2">
          {items.map((m) => {
            const st = STATUS_OPTS.find((s) => s.v === m.status) || STATUS_OPTS[0]
            return (
              <div key={m.id} className="p-3 rounded-lg flex items-start gap-3" style={{ background: '#F9F7F4' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-900">{fmtDate(m.dtInfracao)}</span>
                    {m.numeroAuto && <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: '#F1EFE8', color: '#666' }}>AIT {m.numeroAuto}</span>}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.text }}>{st.l}</span>
                    {m.gravidade && <span className="text-xs text-gray-500">{m.gravidade}</span>}
                    {m.pontos != null && m.pontos > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#FDEEEE', color: '#8B0000' }}>
                        {m.pontos} pt{m.pontos > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 mb-1">{m.descricao}</p>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                    <span className="font-semibold text-gray-700">{fmtBRL(m.valorOriginal)}</span>
                    {m.valorPago != null && m.valorPago !== m.valorOriginal && <span>Pago: {fmtBRL(m.valorPago)}</span>}
                    {m.dtVencimento && <span>Vence: {fmtDate(m.dtVencimento)}</span>}
                    {m.local && <span>📍 {m.local}</span>}
                    {m.orgaoAutuador && <span>{m.orgaoAutuador}</span>}
                    {m.motorista && <span>Cond.: {m.motorista.nome}</span>}
                  </div>
                </div>
                <button onClick={() => setModal(m)} className="text-gray-500 hover:text-gray-900 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => excluir(m.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <MultaModal
          caminhaoId={caminhaoId}
          multa={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, sub, highlight, cor = '#FFAF06' }: any) {
  return (
    <div className="p-3 rounded-xl" style={{ background: highlight ? '#FDEEEE' : '#F9F7F4', border: highlight ? `1px solid ${cor}33` : '1px solid transparent' }}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-bold mt-0.5" style={{ color: highlight ? cor : '#111' }}>{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

function MultaModal({ caminhaoId, multa, onClose, onSaved }: any) {
  const isEdit = !!multa?.id
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [form, setForm] = useState({
    dtInfracao: multa?.dtInfracao ? new Date(multa.dtInfracao).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    dtNotificacao: multa?.dtNotificacao ? new Date(multa.dtNotificacao).toISOString().slice(0, 10) : '',
    dtVencimento: multa?.dtVencimento ? new Date(multa.dtVencimento).toISOString().slice(0, 10) : '',
    dtPagamento: multa?.dtPagamento ? new Date(multa.dtPagamento).toISOString().slice(0, 10) : '',
    numeroAuto: multa?.numeroAuto || '',
    orgaoAutuador: multa?.orgaoAutuador || '',
    codigoInfracao: multa?.codigoInfracao || '',
    descricao: multa?.descricao || '',
    local: multa?.local || '',
    gravidade: multa?.gravidade || '',
    pontos: multa?.pontos != null ? String(multa.pontos) : '',
    valorOriginal: multa?.valorOriginal != null ? String(multa.valorOriginal) : '',
    valorPago: multa?.valorPago != null ? String(multa.valorPago) : '',
    status: multa?.status || 'PENDENTE',
    motoristaId: multa?.motoristaId || '',
    responsavel: multa?.responsavel || '',
    observacoes: multa?.observacoes || '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.get('/motoristas').then((r) => setMotoristas(r.data))
  }, [])

  // Auto-preenche pontos quando muda gravidade (se ainda vazio)
  const setGravidade = (g: string) => {
    setForm((f) => ({ ...f, gravidade: g, pontos: f.pontos || (PONTOS_PADRAO[g] ? String(PONTOS_PADRAO[g]) : '') }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.descricao) return setErro('Descrição é obrigatória.')
    if (!form.valorOriginal) return setErro('Valor da multa é obrigatório.')
    setLoading(true); setErro('')
    try {
      const payload = { ...form, caminhaoId }
      if (isEdit) await api.put(`/frota/multas/${multa.id}`, payload)
      else await api.post('/frota/multas', payload)
      onSaved()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">{isEdit ? 'Editar' : 'Nova'} multa / infração</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data da infração *</label>
            <input type="date" value={form.dtInfracao} onChange={(e) => setForm({ ...form, dtInfracao: e.target.value })} className={inputCls} style={inputStyle} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nº do AIT</label>
            <input value={form.numeroAuto} onChange={(e) => setForm({ ...form, numeroAuto: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Órgão autuador</label>
            <input value={form.orgaoAutuador} onChange={(e) => setForm({ ...form, orgaoAutuador: e.target.value })} placeholder="DNIT, DETRAN-PE..." className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Descrição *</label>
          <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} placeholder="Ex: Excesso de velocidade — até 20% acima da máxima permitida" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Código (CTB)</label>
            <input value={form.codigoInfracao} onChange={(e) => setForm({ ...form, codigoInfracao: e.target.value })} placeholder="Ex: 605-30" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Gravidade</label>
            <select value={form.gravidade} onChange={(e) => setGravidade(e.target.value)} className={inputCls} style={inputStyle}>
              {GRAVIDADES.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pontos na CNH</label>
            <input type="number" min="0" value={form.pontos} onChange={(e) => setForm({ ...form, pontos: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Local da infração</label>
          <input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="BR-101 km 32, Recife/PE" className={inputCls} style={inputStyle} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Valor original (R$) *</label>
            <input type="number" step="0.01" min="0" value={form.valorOriginal} onChange={(e) => setForm({ ...form, valorOriginal: e.target.value })} className={inputCls} style={inputStyle} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Valor pago (R$)</label>
            <input type="number" step="0.01" min="0" value={form.valorPago} onChange={(e) => setForm({ ...form, valorPago: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Vencimento</label>
            <input type="date" value={form.dtVencimento} onChange={(e) => setForm({ ...form, dtVencimento: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notificação</label>
            <input type="date" value={form.dtNotificacao} onChange={(e) => setForm({ ...form, dtNotificacao: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data de pagamento</label>
            <input type="date" value={form.dtPagamento} onChange={(e) => setForm({ ...form, dtPagamento: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls} style={inputStyle}>
              {STATUS_OPTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Motorista (se identificado)</label>
            <select value={form.motoristaId} onChange={(e) => setForm({ ...form, motoristaId: e.target.value })} className={inputCls} style={inputStyle}>
              <option value="">— Não identificado / empresa assume</option>
              {motoristas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Responsável pelo pagamento</label>
            <input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Ex: Empresa, motorista..." className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Observações</label>
          <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
        </div>
        {erro && <div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Salvar' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
