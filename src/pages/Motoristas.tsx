import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { User, Plus, Phone, CreditCard, X, Loader2, AlertCircle } from 'lucide-react'

export default function Motoristas() {
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAtivo, setFiltroAtivo] = useState('true')
  const [showNovo, setShowNovo] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/motoristas', { params: filtroAtivo !== '' ? { ativo: filtroAtivo } : {} })
      .then((r) => setMotoristas(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroAtivo])

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Motoristas</h1>
          <p className="text-gray-500 text-sm mt-1">{motoristas.length} motoristas cadastrados</p>
        </div>
        <button
          onClick={() => setShowNovo(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" />
          Novo motorista
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={filtroAtivo}
          onChange={(e) => setFiltroAtivo(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="true">Apenas ativos</option>
          <option value="false">Apenas inativos</option>
          <option value="">Todos</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : motoristas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum motorista encontrado</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {motoristas.map((m) => {
            const caminhao = m.alocacoes?.[0]?.caminhao
            const cnhVencendo = m.cnhValida && new Date(m.cnhValida).getTime() - Date.now() < 30 * 86400000
            return (
              <div key={m.id} className="bg-white rounded-2xl p-5 flex items-center gap-4 animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white" style={{ background: '#FFAF06' }}>
                  {m.nome.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900">{m.nome}</span>
                    <span className="text-xs text-gray-400">#{m.matricula}</span>
                    {!m.ativo && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F1EFE8', color: '#888' }}>Inativo</span>}
                    {cnhVencendo && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#FEF3E2', color: '#633806' }}>CNH vencendo</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    {m.telefone && (<span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {m.telefone}</span>)}
                    {m.cnh && (<span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> CNH {m.cnh}</span>)}
                    {caminhao && <span>Caminhão: {caminhao.codigo} ({caminhao.placa})</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showNovo && <NovoMotoristaModal onClose={() => setShowNovo(false)} onSuccess={() => { setShowNovo(false); load() }} />}
    </div>
  )
}

function NovoMotoristaModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '', matricula: '', pin: '', telefone: '', cnh: '', cnhValida: '',
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.nome || !form.matricula || !form.pin) return setErro('Nome, matrícula e PIN são obrigatórios.')
    if (form.pin.length < 4) return setErro('PIN deve ter pelo menos 4 dígitos.')
    setLoading(true)
    try {
      await api.post('/motoristas', { ...form, cnhValida: form.cnhValida || null })
      onSuccess()
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao cadastrar motorista.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-900">Novo motorista</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nome completo *</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Matrícula *</label>
              <input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} required placeholder="MOT-001" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">PIN (login app) *</label>
              <input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} required maxLength={6} placeholder="4-6 dígitos" className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Telefone</label>
            <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(81) 9 0000-0000" className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">CNH</label>
              <input value={form.cnh} onChange={(e) => setForm({ ...form, cnh: e.target.value })} placeholder="Número" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">CNH válida até</label>
              <input value={form.cnhValida} onChange={(e) => setForm({ ...form, cnhValida: e.target.value })} type="date" className={inputCls} style={inputStyle} />
            </div>
          </div>
          {erro && (<div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>)}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
