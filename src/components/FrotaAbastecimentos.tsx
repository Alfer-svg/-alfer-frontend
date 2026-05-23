import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from './Modal'
import { Fuel, Plus, AlertCircle, Loader2, X, Pencil, Trash2, TrendingUp } from 'lucide-react'

const COMBUSTIVEIS = [
  { v: 'DIESEL_S10', l: 'Diesel S10' },
  { v: 'DIESEL_COMUM', l: 'Diesel Comum' },
  { v: 'ARLA_32', l: 'Arla 32' },
  { v: 'GASOLINA', l: 'Gasolina' },
  { v: 'ETANOL', l: 'Etanol' },
  { v: 'GNV', l: 'GNV' },
  { v: 'OUTRO', l: 'Outro' },
]

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')
const fmtBRL = (v?: number | null) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtNum = (v?: number | null, dec = 2) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export default function FrotaAbastecimentos({ caminhaoId, kmAtual }: { caminhaoId: string; kmAtual: number }) {
  const [items, setItems] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<any | null>(null)
  const [erro, setErro] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get(`/frota/caminhoes/${caminhaoId}/abastecimentos`),
      api.get(`/frota/caminhoes/${caminhaoId}/abastecimentos/stats`),
    ])
      .then(([r1, r2]) => { setItems(r1.data); setStats(r2.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [caminhaoId])

  const excluir = async (id: string) => {
    if (!confirm('Excluir este abastecimento?')) return
    try {
      await api.delete(`/frota/abastecimentos/${id}`)
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao excluir')
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Fuel className="w-4 h-4" /> Abastecimentos
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

      {/* Cards de stats */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <StatCard label="Consumo médio" value={stats.consumoMedio != null ? `${fmtNum(stats.consumoMedio, 2)} km/L` : '—'} icon={<TrendingUp className="w-3 h-3" />} highlight />
          <StatCard label="Gasto no mês" value={fmtBRL(stats.gastoMes)} sub={`${fmtNum(stats.litrosMes)} L`} />
          <StatCard label="Preço médio /L" value={fmtBRL(stats.precoLitroMedio)} />
          <StatCard label="Total gasto" value={fmtBRL(stats.totalGasto)} sub={`${stats.total} abast.`} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin inline" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum abastecimento registrado.</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => {
            const combLabel = COMBUSTIVEIS.find((c) => c.v === a.combustivel)?.l || a.combustivel
            return (
              <div key={a.id} className="p-3 rounded-lg flex items-start gap-3" style={{ background: '#F9F7F4' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-900">{fmtDate(a.dtAbastecimento)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F1EFE8', color: '#666' }}>{combLabel}</span>
                    {!a.tanqueCheio && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FEF3E2', color: '#633806' }}>Parcial</span>
                    )}
                    {a.kmL != null && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#EAF3DE', color: '#27500A' }}>
                        {fmtNum(a.kmL)} km/L
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                    <span>{a.kmAbastecimento.toLocaleString('pt-BR')} km</span>
                    <span>{fmtNum(a.litros)} L</span>
                    <span>{fmtBRL(a.precoLitro)}/L</span>
                    <span className="font-semibold text-gray-700">{fmtBRL(a.valorTotal)}</span>
                    {a.posto && <span>{a.posto}</span>}
                    {a.motorista && <span>{a.motorista.nome}</span>}
                  </div>
                </div>
                <button onClick={() => setModal(a)} className="text-gray-500 hover:text-gray-900 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => excluir(a.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <AbastecimentoModal
          caminhaoId={caminhaoId}
          kmAtual={kmAtual}
          aba={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, sub, icon, highlight }: { label: string; value: string; sub?: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: highlight ? '#FFF8E6' : '#F9F7F4', border: highlight ? '1px solid #FFE5A0' : '1px solid transparent' }}>
      <div className="text-xs text-gray-500 flex items-center gap-1">{icon}{label}</div>
      <div className="text-sm font-bold text-gray-900 mt-0.5">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

function AbastecimentoModal({ caminhaoId, kmAtual, aba, onClose, onSaved }: any) {
  const isEdit = !!aba?.id
  const [form, setForm] = useState({
    dtAbastecimento: aba?.dtAbastecimento
      ? new Date(aba.dtAbastecimento).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    kmAbastecimento: aba?.kmAbastecimento != null ? String(aba.kmAbastecimento) : String(kmAtual || 0),
    combustivel: aba?.combustivel || 'DIESEL_S10',
    litros: aba?.litros != null ? String(aba.litros) : '',
    precoLitro: aba?.precoLitro != null ? String(aba.precoLitro) : '',
    valorTotal: aba?.valorTotal != null ? String(aba.valorTotal) : '',
    tanqueCheio: aba?.tanqueCheio !== false,
    posto: aba?.posto || '',
    numeroNota: aba?.numeroNota || '',
    observacoes: aba?.observacoes || '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [autoTotal, setAutoTotal] = useState(!isEdit)

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  const litrosNum = Number(form.litros) || 0
  const precoNum = Number(form.precoLitro) || 0
  const totalCalculado = +(litrosNum * precoNum).toFixed(2)
  const totalExibido = autoTotal ? String(totalCalculado || '') : form.valorTotal

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.litros || Number(form.litros) <= 0) return setErro('Informe os litros.')
    if (!form.precoLitro || Number(form.precoLitro) <= 0) return setErro('Informe o preço por litro.')
    setLoading(true); setErro('')
    try {
      const payload: any = { ...form, caminhaoId, valorTotal: autoTotal ? totalCalculado : Number(form.valorTotal || totalCalculado) }
      if (isEdit) await api.put(`/frota/abastecimentos/${aba.id}`, payload)
      else await api.post('/frota/abastecimentos', payload)
      onSaved()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">{isEdit ? 'Editar' : 'Novo'} abastecimento</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data e hora</label>
            <input type="datetime-local" value={form.dtAbastecimento} onChange={(e) => setForm({ ...form, dtAbastecimento: e.target.value })} className={inputCls} style={inputStyle} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">KM no abastecimento</label>
            <input type="number" min="0" value={form.kmAbastecimento} onChange={(e) => setForm({ ...form, kmAbastecimento: e.target.value })} className={inputCls} style={inputStyle} required />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Combustível</label>
          <select value={form.combustivel} onChange={(e) => setForm({ ...form, combustivel: e.target.value })} className={inputCls} style={inputStyle}>
            {COMBUSTIVEIS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Litros *</label>
            <input type="number" step="0.001" min="0" value={form.litros} onChange={(e) => setForm({ ...form, litros: e.target.value })} placeholder="Ex: 120.5" className={inputCls} style={inputStyle} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Preço/L *</label>
            <input type="number" step="0.0001" min="0" value={form.precoLitro} onChange={(e) => setForm({ ...form, precoLitro: e.target.value })} placeholder="Ex: 6.49" className={inputCls} style={inputStyle} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center justify-between">
              Valor total (R$)
              <button type="button" onClick={() => setAutoTotal(!autoTotal)} className="text-[10px] text-orange-600 hover:underline">
                {autoTotal ? 'editar' : 'auto'}
              </button>
            </label>
            <input
              type="number" step="0.01" min="0"
              value={totalExibido}
              onChange={(e) => { setAutoTotal(false); setForm({ ...form, valorTotal: e.target.value }) }}
              className={inputCls}
              style={{ ...inputStyle, background: autoTotal ? '#F9F7F4' : '#FFFFFF' }}
              readOnly={autoTotal}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.tanqueCheio}
            onChange={(e) => setForm({ ...form, tanqueCheio: e.target.checked })}
            className="w-4 h-4"
          />
          Tanque cheio (necessário pra calcular km/L corretamente)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Posto</label>
            <input value={form.posto} onChange={(e) => setForm({ ...form, posto: e.target.value })} placeholder="Ex: Ipiranga BR-101" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nº cupom / nota</label>
            <input value={form.numeroNota} onChange={(e) => setForm({ ...form, numeroNota: e.target.value })} className={inputCls} style={inputStyle} />
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
