import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from './Modal'
import { Users, Plus, AlertCircle, Loader2, X, Trash2, Clock } from 'lucide-react'

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

function diasEntre(ini: string, fim?: string | null) {
  const inicio = new Date(ini).getTime()
  const fimD = fim ? new Date(fim).getTime() : Date.now()
  return Math.max(0, Math.floor((fimD - inicio) / 86400000))
}

export default function FrotaMotoristas({ caminhaoId }: { caminhaoId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [erro, setErro] = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/frota/caminhoes/${caminhaoId}/alocacoes`)
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [caminhaoId])

  const encerrar = async (id: string) => {
    if (!confirm('Encerrar a alocação atual (motorista deixa de dirigir este caminhão)?')) return
    try {
      await api.post(`/frota/alocacoes/${id}/encerrar`, {})
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao encerrar')
    }
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir este registro do histórico? Não dá pra desfazer.')) return
    try {
      await api.delete(`/frota/alocacoes/${id}`)
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao excluir')
    }
  }

  const ativa = items.find((i) => i.ativo)
  const historico = items.filter((i) => !i.ativo)

  return (
    <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4" /> Motoristas
        </h2>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: '#FFF8E6', color: '#FFAF06' }}
        >
          <Plus className="w-3 h-3" /> Alocar motorista
        </button>
      </div>

      {erro && (
        <div className="p-3 mb-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE' }}>
          <AlertCircle className="w-4 h-4" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin inline" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum motorista alocado.</p>
      ) : (
        <>
          {/* Atual */}
          {ativa && (
            <div className="p-4 rounded-xl mb-3 flex items-center gap-3" style={{ background: '#EAF3DE', border: '1px solid #C5DDA2' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#27500A', color: '#fff' }}>
                {ativa.motorista?.nome?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{ativa.motorista?.nome}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#27500A', color: '#fff' }}>Atual</span>
                </div>
                <div className="text-xs text-gray-700 mt-0.5 flex gap-3 flex-wrap">
                  <span>Matrícula: {ativa.motorista?.matricula}</span>
                  {ativa.motorista?.telefone && <span>📞 {ativa.motorista.telefone}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Há {diasEntre(ativa.dtInicio)} dia(s)</span>
                </div>
              </div>
              <button onClick={() => encerrar(ativa.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium text-gray-700 hover:bg-white" style={{ border: '1px solid #C5DDA2' }}>
                Encerrar
              </button>
            </div>
          )}

          {/* Histórico */}
          {historico.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-500 mb-2 mt-3">Histórico ({historico.length})</p>
              <div className="space-y-2">
                {historico.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg flex items-center gap-3" style={{ background: '#F9F7F4' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs" style={{ background: '#E0DDD8', color: '#666' }}>
                      {a.motorista?.nome?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800">{a.motorista?.nome}</div>
                      <div className="text-xs text-gray-500 flex gap-3 flex-wrap">
                        <span>{fmtDate(a.dtInicio)} → {fmtDate(a.dtFim)}</span>
                        <span>{diasEntre(a.dtInicio, a.dtFim)} dia(s)</span>
                      </div>
                    </div>
                    <button onClick={() => excluir(a.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {modal && (
        <AlocarModal
          caminhaoId={caminhaoId}
          temAtual={!!ativa}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); load() }}
        />
      )}
    </div>
  )
}

function AlocarModal({ caminhaoId, temAtual, onClose, onSaved }: any) {
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [form, setForm] = useState({
    motoristaId: '',
    dtInicio: new Date().toISOString().slice(0, 10),
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.get('/motoristas').then((r) => setMotoristas(r.data.filter((m: any) => m.ativo)))
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.motoristaId) return setErro('Selecione um motorista.')
    setLoading(true); setErro('')
    try {
      await api.post(`/frota/caminhoes/${caminhaoId}/alocacoes`, form)
      onSaved()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao alocar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">Alocar motorista</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      {temAtual && (
        <p className="text-xs p-3 rounded-lg mb-3" style={{ background: '#FEF3E2', color: '#633806' }}>
          Já existe motorista ativo. Ao confirmar, o atual será encerrado automaticamente.
        </p>
      )}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Motorista *</label>
          <select value={form.motoristaId} onChange={(e) => setForm({ ...form, motoristaId: e.target.value })} className={inputCls} style={inputStyle} required>
            <option value="">Selecione</option>
            {motoristas.map((m) => <option key={m.id} value={m.id}>{m.nome} — {m.matricula}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Data de início</label>
          <input type="date" value={form.dtInicio} onChange={(e) => setForm({ ...form, dtInicio: e.target.value })} className={inputCls} style={inputStyle} />
        </div>
        {erro && <div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Alocar
          </button>
        </div>
      </form>
    </Modal>
  )
}
