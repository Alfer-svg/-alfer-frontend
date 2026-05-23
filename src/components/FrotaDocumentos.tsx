import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from './Modal'
import { FileText, Plus, AlertCircle, Loader2, X, Pencil, Trash2 } from 'lucide-react'

const TIPOS_DOC = [
  { v: 'CRLV', l: 'CRLV / Licenciamento' },
  { v: 'IPVA', l: 'IPVA' },
  { v: 'SEGURO', l: 'Seguro' },
  { v: 'ANTT', l: 'ANTT / RNTRC' },
  { v: 'CRONOTACOGRAFO', l: 'Cronotacógrafo' },
  { v: 'INSPECAO_VEICULAR', l: 'Inspeção veicular' },
  { v: 'OUTRO', l: 'Outro' },
]

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

function statusVencimento(dtVencimento: string | null, alertaDias: number) {
  if (!dtVencimento) return { bg: '#F1EFE8', text: '#888', label: 'Sem data' }
  const dias = Math.ceil((new Date(dtVencimento).getTime() - Date.now()) / 86400000)
  if (dias < 0) return { bg: '#FDEEEE', text: '#8B0000', label: `Vencido há ${Math.abs(dias)} dias` }
  if (dias === 0) return { bg: '#FDEEEE', text: '#8B0000', label: 'Vence hoje' }
  if (dias <= alertaDias) return { bg: '#FEF3E2', text: '#633806', label: `Vence em ${dias} dias` }
  return { bg: '#EAF3DE', text: '#27500A', label: `Vence em ${dias} dias` }
}

export default function FrotaDocumentos({ caminhaoId }: { caminhaoId: string }) {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<any | null>(null)
  const [erro, setErro] = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/frota/caminhoes/${caminhaoId}/documentos`)
      .then((r) => setDocs(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [caminhaoId])

  const excluir = async (id: string) => {
    if (!confirm('Excluir este documento?')) return
    try {
      await api.delete(`/frota/documentos/${id}`)
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao excluir')
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Documentos do veículo
        </h2>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: '#FFF8E6', color: '#FFAF06' }}
        >
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>

      {erro && (
        <div className="p-3 mb-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE' }}>
          <AlertCircle className="w-4 h-4" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin inline" /></div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum documento cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => {
            const st = statusVencimento(d.dtVencimento, d.alertaDias)
            const tipoLabel = TIPOS_DOC.find((t) => t.v === d.tipo)?.l || d.tipo
            return (
              <div key={d.id} className="p-3 rounded-lg flex items-center gap-3" style={{ background: '#F9F7F4' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-900">{d.nome}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F1EFE8', color: '#666' }}>{tipoLabel}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                    {d.numero && <span>Nº {d.numero}</span>}
                    {d.dtVencimento && <span>Vence: {fmtDate(d.dtVencimento)}</span>}
                    {d.valor && <span>R$ {Number(d.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                    {d.fornecedor && <span>{d.fornecedor}</span>}
                  </div>
                </div>
                <button onClick={() => setModal(d)} className="text-gray-500 hover:text-gray-900 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => excluir(d.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <DocumentoModal
          caminhaoId={caminhaoId}
          doc={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

function DocumentoModal({ caminhaoId, doc, onClose, onSaved }: any) {
  const isEdit = !!doc?.id
  const [form, setForm] = useState({
    tipo: doc?.tipo || 'CRLV',
    nome: doc?.nome || '',
    numero: doc?.numero || '',
    dtEmissao: doc?.dtEmissao ? new Date(doc.dtEmissao).toISOString().slice(0, 10) : '',
    dtVencimento: doc?.dtVencimento ? new Date(doc.dtVencimento).toISOString().slice(0, 10) : '',
    valor: doc?.valor != null ? String(doc.valor) : '',
    fornecedor: doc?.fornecedor || '',
    alertaDias: String(doc?.alertaDias ?? 30),
    observacoes: doc?.observacoes || '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true); setErro('')
    try {
      const payload: any = { ...form, caminhaoId }
      payload.valor = form.valor ? Number(form.valor) : null
      payload.alertaDias = Number(form.alertaDias) || 30
      if (!form.nome) {
        const t = TIPOS_DOC.find((x) => x.v === form.tipo)
        payload.nome = t?.l || form.tipo
      }
      if (isEdit) await api.put(`/frota/documentos/${doc.id}`, payload)
      else await api.post('/frota/documentos', payload)
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
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">{isEdit ? 'Editar' : 'Novo'} documento</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputCls} style={inputStyle}>
              {TIPOS_DOC.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nome (opcional)</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: CRLV 2026" className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Número / Apólice</label>
            <input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fornecedor (seguradora, despachante)</label>
            <input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data emissão</label>
            <input type="date" value={form.dtEmissao} onChange={(e) => setForm({ ...form, dtEmissao: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data vencimento</label>
            <input type="date" value={form.dtVencimento} onChange={(e) => setForm({ ...form, dtVencimento: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Alerta (dias antes)</label>
            <input type="number" min="0" value={form.alertaDias} onChange={(e) => setForm({ ...form, alertaDias: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Valor pago (R$)</label>
          <input type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" className={inputCls} style={inputStyle} />
        </div>
        {erro && <div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
