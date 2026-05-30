import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { User, Plus, Phone, CreditCard, X, Loader2, AlertCircle, Trash2, PowerOff, Power, Pencil, Clock, MapPin, Play, Square } from 'lucide-react'

export default function Motoristas() {
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAtivo, setFiltroAtivo] = useState('true')
  const [showNovo, setShowNovo] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [verJornadas, setVerJornadas] = useState<any>(null)

  const [acaoErro, setAcaoErro] = useState('')
  const [acaoLoadingId, setAcaoLoadingId] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/motoristas', { params: filtroAtivo !== '' ? { ativo: filtroAtivo } : {} })
      .then((r) => setMotoristas(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroAtivo])

  const alternarAtivo = async (m: any) => {
    setAcaoErro('')
    setAcaoLoadingId(m.id)
    try {
      await api.put(`/motoristas/${m.id}`, { ativo: !m.ativo })
      load()
    } catch (err: any) {
      setAcaoErro(err.response?.data?.message || 'Erro ao alterar status.')
    } finally {
      setAcaoLoadingId('')
    }
  }

  const excluir = async (m: any) => {
    if (!confirm(`Excluir DEFINITIVAMENTE o motorista "${m.nome}"? Esta ação não pode ser desfeita.`)) return
    if (!confirm('Confirma de novo? Se houver histórico vinculado, a exclusão será bloqueada.')) return
    setAcaoErro('')
    setAcaoLoadingId(m.id)
    try {
      await api.delete(`/motoristas/${m.id}`)
      load()
    } catch (err: any) {
      setAcaoErro(err.response?.data?.message || 'Erro ao excluir motorista.')
    } finally {
      setAcaoLoadingId('')
    }
  }

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

      {acaoErro && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {acaoErro}
        </div>
      )}

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
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setVerJornadas(m)}
                    title="Ver jornadas (ponto)"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                    style={{ border: '1px solid #E0DDD8' }}
                  >
                    <Clock className="w-3 h-3" /> Jornadas
                  </button>
                  <button
                    onClick={() => setEditando(m)}
                    title="Editar"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                    style={{ border: '1px solid #E0DDD8' }}
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={() => alternarAtivo(m)}
                    disabled={acaoLoadingId === m.id}
                    title={m.ativo ? 'Inativar' : 'Reativar'}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                    style={{ background: m.ativo ? '#F1EFE8' : '#EAF3DE', color: m.ativo ? '#888' : '#27500A' }}
                  >
                    {m.ativo ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                    {m.ativo ? 'Inativar' : 'Reativar'}
                  </button>
                  <button
                    onClick={() => excluir(m)}
                    disabled={acaoLoadingId === m.id}
                    title="Excluir permanentemente"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    style={{ border: '1px solid #FACACA' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showNovo && <MotoristaModal onClose={() => setShowNovo(false)} onSuccess={() => { setShowNovo(false); load() }} />}
      {editando && <MotoristaModal motorista={editando} onClose={() => setEditando(null)} onSuccess={() => { setEditando(null); load() }} />}
      {verJornadas && <JornadasModal motorista={verJornadas} onClose={() => setVerJornadas(null)} />}
    </div>
  )
}

function JornadasModal({ motorista, onClose }: { motorista: any; onClose: () => void }) {
  const [jornadas, setJornadas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/jornadas', { params: { motoristaId: motorista.id } })
      .then((r) => setJornadas(r.data || []))
      .finally(() => setLoading(false))
  }, [motorista.id])

  const fmtData = (s: string) => new Date(s).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  const fmtHora = (s: string) => new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const duracao = (ini: string, fim: string) => {
    const min = Math.max(0, Math.round((new Date(fim).getTime() - new Date(ini).getTime()) / 60000))
    const h = Math.floor(min / 60), m = min % 60
    return h > 0 ? `${h}h ${m}min` : `${m}min`
  }
  const mapsLink = (lat: any, lng: any) => `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: '#FFAF06' }} /> Jornadas
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{motorista.nome} · #{motorista.matricula}</p>
        </div>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      ) : jornadas.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
          Nenhuma jornada registrada.
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {jornadas.map((j) => (
            <div key={j.id} className="rounded-xl border p-3.5" style={{ borderColor: '#E0DDD8' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900 text-sm capitalize">{fmtData(j.dtInicio)}</span>
                {j.dtFim ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F1EFE8', color: '#555' }}>
                    {duracao(j.dtInicio, j.dtFim)}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EAF3DE', color: '#27500A' }}>
                    Em aberto
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Marca
                  icon={<Play className="w-3.5 h-3.5 text-green-700" />}
                  label="Início"
                  hora={fmtHora(j.dtInicio)}
                  endereco={j.inicioEndereco}
                  lat={j.inicioLat} lng={j.inicioLng}
                  mapsLink={mapsLink}
                />
                {j.dtFim && (
                  <Marca
                    icon={<Square className="w-3.5 h-3.5 text-red-700" />}
                    label="Término"
                    hora={fmtHora(j.dtFim)}
                    endereco={j.fimEndereco}
                    lat={j.fimLat} lng={j.fimLng}
                    mapsLink={mapsLink}
                  />
                )}
              </div>

              {j.caminhao && (
                <div className="text-xs text-gray-400 mt-2">Caminhão: {j.caminhao.codigo}{j.caminhao.placa ? ` (${j.caminhao.placa})` : ''}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function Marca({ icon, label, hora, endereco, lat, lng, mapsLink }: {
  icon: React.ReactNode; label: string; hora: string; endereco: string | null
  lat: any; lng: any; mapsLink: (lat: any, lng: any) => string
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ border: '1px solid #E0DDD8' }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-gray-900">
          <span className="text-gray-500">{label}:</span> <strong>{hora}</strong>
        </div>
        {endereco ? (
          <div className="flex items-start gap-1 text-xs text-gray-500 mt-0.5">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {lat != null && lng != null ? (
              <a href={mapsLink(lat, lng)} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: '#1a73e8' }}>
                {endereco}
              </a>
            ) : (
              <span>{endereco}</span>
            )}
          </div>
        ) : lat != null && lng != null ? (
          <a href={mapsLink(lat, lng)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs mt-0.5 hover:underline" style={{ color: '#1a73e8' }}>
            <MapPin className="w-3 h-3" /> Ver no mapa
          </a>
        ) : (
          <div className="text-xs text-gray-400 mt-0.5">Sem localização</div>
        )}
      </div>
    </div>
  )
}

function MotoristaModal({ motorista, onClose, onSuccess }: { motorista?: any; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!motorista
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: motorista?.nome || '',
    matricula: motorista?.matricula || '',
    pin: '',
    telefone: motorista?.telefone || '',
    cnh: motorista?.cnh || '',
    cnhValida: motorista?.cnhValida ? new Date(motorista.cnhValida).toISOString().slice(0, 10) : '',
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.nome || !form.matricula) return setErro('Nome e matrícula são obrigatórios.')
    if (!isEdit && !form.pin) return setErro('PIN é obrigatório no cadastro.')
    if (form.pin && form.pin.length < 4) return setErro('PIN deve ter pelo menos 4 dígitos.')
    setLoading(true)
    try {
      const payload: any = {
        nome: form.nome,
        matricula: form.matricula,
        telefone: form.telefone || null,
        cnh: form.cnh || null,
        cnhValida: form.cnhValida || null,
      }
      if (form.pin) payload.pin = form.pin
      if (isEdit) {
        await api.put(`/motoristas/${motorista.id}`, payload)
      } else {
        await api.post('/motoristas', payload)
      }
      onSuccess()
    } catch (err: any) {
      setErro(err.response?.data?.message || `Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} motorista.`)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">{isEdit ? 'Editar motorista' : 'Novo motorista'}</h2>
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
              <label className="block text-xs text-gray-500 mb-1">PIN (login app) {isEdit ? '' : '*'}</label>
              <input
                value={form.pin}
                onChange={(e) => setForm({ ...form, pin: e.target.value })}
                required={!isEdit}
                maxLength={6}
                placeholder={isEdit ? 'Deixe em branco para manter' : '4-6 dígitos'}
                className={inputCls}
                style={inputStyle}
              />
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
              {isEdit ? 'Salvar alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
    </Modal>
  )
}
