import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { Calendar, Plus, ChevronLeft, ChevronRight, Truck, Package, User, MapPin, CheckCircle2, Clock, X, Loader2, AlertCircle } from 'lucide-react'

const tipoLabel: Record<string, string> = {
  ENTREGA: 'Entrega',
  RETIRADA: 'Retirada',
  TROCA: 'Troca',
  SERVICO_AVULSO: 'Serviço avulso',
  MOBILIZACAO: 'Mobilização',
  DESMOBILIZACAO: 'Desmobilização',
  MANUTENCAO: 'Manutenção',
}

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  AGENDADA: { bg: '#E3EEFA', text: '#1A5276', label: 'Agendada' },
  EM_ROTA: { bg: '#FEF3E2', text: '#633806', label: 'Em rota' },
  CONCLUIDA: { bg: '#EAF3DE', text: '#27500A', label: 'Concluída' },
  CANCELADA: { bg: '#FDEEEE', text: '#8B0000', label: 'Cancelada' },
}

export default function Agenda() {
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [operacoes, setOperacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNova, setShowNova] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/agenda/dia', { params: { data } })
      .then((r) => setOperacoes(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [data])

  const mudarDia = (delta: number) => {
    const d = new Date(data + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setData(d.toISOString().slice(0, 10))
  }

  const concluir = async (id: string) => {
    await api.put(`/agenda/${id}/concluir`)
    load()
  }

  const dataExibida = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500 text-sm mt-1">Operações agendadas, em rota e concluídas</p>
        </div>
        <button
          onClick={() => setShowNova(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" />
          Nova operação
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <button onClick={() => mudarDia(-1)} className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="px-3 py-2 rounded-lg text-sm font-medium" style={{ border: '1px solid #E0DDD8' }} />
        <button onClick={() => mudarDia(1)} className="p-2 rounded-lg hover:bg-gray-50"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
        <span className="text-sm text-gray-700 capitalize">{dataExibida}</span>
        <button onClick={() => setData(new Date().toISOString().slice(0, 10))} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700" style={{ background: '#F1EFE8' }}>Hoje</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : operacoes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma operação agendada para este dia</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {operacoes.map((op) => {
            const status = statusColor[op.status] || statusColor.AGENDADA
            return (
              <div key={op.id} className="bg-white rounded-2xl p-5 animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start gap-4">
                  <div className="text-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-gray-900">{op.horaAgendada || '--:--'}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{tipoLabel[op.tipo] || op.tipo}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: status.bg, color: status.text }}>
                        {status.label}
                      </span>
                      {op.clienteNome && <span className="text-sm text-gray-700">{op.clienteNome}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {op.endDestino}</span>
                      {op.motorista && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {op.motorista.nome}</span>}
                      {op.caminhao && <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {op.caminhao.codigo}</span>}
                      {op.equipamento && <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {op.equipamento.codigo}</span>}
                    </div>
                    {op.observacoes && <p className="text-xs text-gray-500 mt-2">{op.observacoes}</p>}
                  </div>
                  {op.status !== 'CONCLUIDA' && op.status !== 'CANCELADA' && (
                    <button
                      onClick={() => concluir(op.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: '#EAF3DE', color: '#27500A' }}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Concluir
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showNova && <NovaOperacaoModal data={data} onClose={() => setShowNova(false)} onSuccess={() => { setShowNova(false); load() }} />}
    </div>
  )
}

function NovaOperacaoModal({ data, onClose, onSuccess }: { data: string; onClose: () => void; onSuccess: () => void }) {
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [caminhoes, setCaminhoes] = useState<any[]>([])
  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    tipo: 'ENTREGA',
    dtAgendada: data,
    horaAgendada: '08:00',
    clienteNome: '',
    endDestino: '',
    motoristaId: '',
    caminhaoId: '',
    equipamentoId: '',
    observacoes: '',
  })

  useEffect(() => {
    Promise.all([
      api.get('/motoristas', { params: { ativo: 'true' } }),
      api.get('/caminhoes'),
      api.get('/equipamentos'),
    ]).then(([m, c, e]) => {
      setMotoristas(m.data)
      setCaminhoes(c.data)
      setEquipamentos(e.data)
    })
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.endDestino) return setErro('Endereço de destino é obrigatório.')
    setLoading(true)
    try {
      await api.post('/agenda', {
        ...form,
        motoristaId: form.motoristaId || null,
        caminhaoId: form.caminhaoId || null,
        equipamentoId: form.equipamentoId || null,
        clienteNome: form.clienteNome || null,
        observacoes: form.observacoes || null,
      })
      onSuccess()
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao criar operação.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">Nova operação</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo *</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputCls} style={inputStyle}>
                {Object.entries(tipoLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cliente</label>
              <input value={form.clienteNome} onChange={(e) => setForm({ ...form, clienteNome: e.target.value })} placeholder="Nome do cliente" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data *</label>
              <input type="date" value={form.dtAgendada} onChange={(e) => setForm({ ...form, dtAgendada: e.target.value })} required className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hora</label>
              <input type="time" value={form.horaAgendada} onChange={(e) => setForm({ ...form, horaAgendada: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Endereço de destino *</label>
            <input value={form.endDestino} onChange={(e) => setForm({ ...form, endDestino: e.target.value })} required placeholder="Rua, número, bairro, cidade..." className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Motorista</label>
              <select value={form.motoristaId} onChange={(e) => setForm({ ...form, motoristaId: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="">— Sem motorista —</option>
                {motoristas.map((m) => <option key={m.id} value={m.id}>{m.nome} (#{m.matricula})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Caminhão</label>
              <select value={form.caminhaoId} onChange={(e) => setForm({ ...form, caminhaoId: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="">— Sem caminhão —</option>
                {caminhoes.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.placa}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Equipamento</label>
              <select value={form.equipamentoId} onChange={(e) => setForm({ ...form, equipamentoId: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="">— Sem equipamento —</option>
                {equipamentos.map((e) => <option key={e.id} value={e.id}>{e.codigo} — {e.modelo}</option>)}
              </select>
            </div>
          </div>
          <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações..." rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
          {erro && (<div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>)}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Agendar
            </button>
          </div>
        </form>
    </Modal>
  )
}
