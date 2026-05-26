import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from './Modal'
import { Wrench, Plus, AlertCircle, Loader2, X, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { fmtDate } from '../utils/data'

const TIPOS = [
  { v: 'REVISAO_KM', l: 'Revisão por KM' },
  { v: 'REVISAO_PERIODO', l: 'Revisão por período (data)' },
  { v: 'CHECKLIST_ITEM', l: 'Item de checklist (pneu, óleo, freio, etc)' },
]


function statusManut(m: any, kmAtual: number) {
  let label = 'Pendente'
  let bg = '#F1EFE8'
  let text = '#888'
  let detalhe = ''
  if (m.kmAlvo != null) {
    const restante = m.kmAlvo - kmAtual
    detalhe = restante < 0
      ? `Vencida há ${Math.abs(restante).toLocaleString('pt-BR')} km`
      : `Faltam ${restante.toLocaleString('pt-BR')} km`
    if (restante < 0) { label = 'Vencida'; bg = '#FDEEEE'; text = '#8B0000' }
    else if (restante <= m.alertaKm) { label = 'Alerta'; bg = '#FEF3E2'; text = '#633806' }
    else { label = 'Em dia'; bg = '#EAF3DE'; text = '#27500A' }
  }
  if (m.dtAlvo) {
    const dias = Math.ceil((new Date(m.dtAlvo).getTime() - Date.now()) / 86400000)
    const dtDetalhe = dias < 0 ? `Vencida há ${Math.abs(dias)} dias` : `Em ${dias} dias`
    detalhe = detalhe ? `${detalhe} • ${dtDetalhe}` : dtDetalhe
    if (dias < 0 && label !== 'Vencida') { label = 'Vencida'; bg = '#FDEEEE'; text = '#8B0000' }
    else if (dias <= m.alertaDias && label === 'Pendente') { label = 'Alerta'; bg = '#FEF3E2'; text = '#633806' }
  }
  return { label, bg, text, detalhe }
}

export default function FrotaManutencoesProg({ caminhaoId, kmAtual }: { caminhaoId: string; kmAtual: number }) {
  const [manuts, setManuts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<any | null>(null)
  const [concluirModal, setConcluirModal] = useState<any | null>(null)
  const [erro, setErro] = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/frota/caminhoes/${caminhaoId}/manutencoes-programadas`)
      .then((r) => setManuts(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [caminhaoId])

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta manutenção programada?')) return
    try {
      await api.delete(`/frota/manutencoes-programadas/${id}`)
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao excluir')
    }
  }

  const ativas = manuts.filter((m) => m.status !== 'CONCLUIDA')
  const concluidas = manuts.filter((m) => m.status === 'CONCLUIDA')

  return (
    <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Wrench className="w-4 h-4" /> Manutenções programadas
        </h2>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: '#FFF8E6', color: '#FFAF06' }}
        >
          <Plus className="w-3 h-3" /> Programar
        </button>
      </div>

      {erro && (
        <div className="p-3 mb-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE' }}>
          <AlertCircle className="w-4 h-4" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin inline" /></div>
      ) : ativas.length === 0 && concluidas.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhuma manutenção programada.</p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {ativas.map((m) => {
              const st = statusManut(m, kmAtual)
              const tipoLabel = TIPOS.find((t) => t.v === m.tipo)?.l || m.tipo
              return (
                <div key={m.id} className="p-3 rounded-lg flex items-center gap-3" style={{ background: '#F9F7F4' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-900">{m.titulo}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F1EFE8', color: '#666' }}>{tipoLabel}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                      {m.kmAlvo != null && <span>Alvo: {m.kmAlvo.toLocaleString('pt-BR')} km</span>}
                      {m.dtAlvo && <span>Em: {fmtDate(m.dtAlvo)}</span>}
                      {m.intervaloKm && <span>A cada {m.intervaloKm.toLocaleString('pt-BR')} km</span>}
                      {m.intervaloMeses && <span>A cada {m.intervaloMeses} mes(es)</span>}
                      {st.detalhe && <span className="font-medium" style={{ color: st.text }}>{st.detalhe}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setConcluirModal(m)}
                    title="Marcar como concluída"
                    className="text-green-700 hover:bg-green-50 p-1 rounded"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setModal(m)} className="text-gray-500 hover:text-gray-900 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => excluir(m.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )
            })}
          </div>

          {concluidas.length > 0 && (
            <details className="text-sm">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Concluídas ({concluidas.length})
              </summary>
              <div className="space-y-1 mt-2">
                {concluidas.slice(0, 10).map((m) => (
                  <div key={m.id} className="p-2 rounded text-xs text-gray-500 flex justify-between" style={{ background: '#F9F7F4' }}>
                    <span>✓ {m.titulo}</span>
                    <span>{fmtDate(m.dtConclusao)} • {m.kmConclusao?.toLocaleString('pt-BR')} km</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {modal && (
        <ManutProgModal
          caminhaoId={caminhaoId}
          manut={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}

      {concluirModal && (
        <ConcluirModal
          manut={concluirModal}
          kmAtual={kmAtual}
          onClose={() => setConcluirModal(null)}
          onSaved={() => { setConcluirModal(null); load() }}
        />
      )}
    </div>
  )
}

function ManutProgModal({ caminhaoId, manut, onClose, onSaved }: any) {
  const isEdit = !!manut?.id
  const [form, setForm] = useState({
    tipo: manut?.tipo || 'REVISAO_KM',
    titulo: manut?.titulo || '',
    descricao: manut?.descricao || '',
    kmAlvo: manut?.kmAlvo != null ? String(manut.kmAlvo) : '',
    intervaloKm: manut?.intervaloKm != null ? String(manut.intervaloKm) : '',
    dtAlvo: manut?.dtAlvo ? new Date(manut.dtAlvo).toISOString().slice(0, 10) : '',
    intervaloMeses: manut?.intervaloMeses != null ? String(manut.intervaloMeses) : '',
    alertaKm: String(manut?.alertaKm ?? 500),
    alertaDias: String(manut?.alertaDias ?? 15),
    prioridade: String(manut?.prioridade ?? 2),
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true); setErro('')
    try {
      const payload = { ...form, caminhaoId }
      if (isEdit) await api.put(`/frota/manutencoes-programadas/${manut.id}`, payload)
      else await api.post('/frota/manutencoes-programadas', payload)
      onSaved()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const mostraKm = form.tipo === 'REVISAO_KM' || form.tipo === 'CHECKLIST_ITEM'
  const mostraData = form.tipo === 'REVISAO_PERIODO' || form.tipo === 'CHECKLIST_ITEM'

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">{isEdit ? 'Editar' : 'Nova'} manutenção programada</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tipo</label>
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputCls} style={inputStyle}>
            {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Título *</label>
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required placeholder="Ex: Revisão dos 50.000 km, Troca de óleo" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Descrição</label>
          <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
        </div>
        {mostraKm && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">KM alvo</label>
              <input type="number" min="0" value={form.kmAlvo} onChange={(e) => setForm({ ...form, kmAlvo: e.target.value })} placeholder="Ex: 50000" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Intervalo KM (repete)</label>
              <input type="number" min="0" value={form.intervaloKm} onChange={(e) => setForm({ ...form, intervaloKm: e.target.value })} placeholder="Ex: 10000" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Alerta (km antes)</label>
              <input type="number" min="0" value={form.alertaKm} onChange={(e) => setForm({ ...form, alertaKm: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
          </div>
        )}
        {mostraData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data alvo</label>
              <input type="date" value={form.dtAlvo} onChange={(e) => setForm({ ...form, dtAlvo: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Intervalo meses (repete)</label>
              <input type="number" min="0" value={form.intervaloMeses} onChange={(e) => setForm({ ...form, intervaloMeses: e.target.value })} placeholder="Ex: 6" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Alerta (dias antes)</label>
              <input type="number" min="0" value={form.alertaDias} onChange={(e) => setForm({ ...form, alertaDias: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
          </div>
        )}
        {erro && <div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Salvar' : 'Programar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ConcluirModal({ manut, kmAtual, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    dtConclusao: new Date().toISOString().slice(0, 10),
    kmConclusao: String(kmAtual || 0),
    valor: '',
    fornecedor: '',
    observacoes: '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true); setErro('')
    try {
      await api.post(`/frota/manutencoes-programadas/${manut.id}/concluir`, {
        ...form,
        kmConclusao: Number(form.kmConclusao),
        valor: form.valor ? Number(form.valor) : null,
      })
      onSaved()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao concluir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">Concluir: {manut.titulo}</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Vai gerar registro no histórico de manutenções{manut.intervaloKm || manut.intervaloMeses ? ' e programar a próxima' : ''}.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data</label>
            <input type="date" value={form.dtConclusao} onChange={(e) => setForm({ ...form, dtConclusao: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">KM</label>
            <input type="number" min="0" value={form.kmConclusao} onChange={(e) => setForm({ ...form, kmConclusao: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Valor (R$)</label>
            <input type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fornecedor</label>
            <input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Observações</label>
          <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
        </div>
        {erro && <div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: loading ? '#1E7B40' : '#27AE60' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Concluir
          </button>
        </div>
      </form>
    </Modal>
  )
}
