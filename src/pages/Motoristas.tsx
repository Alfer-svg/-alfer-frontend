import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { User, Plus, Phone, CreditCard, X, Loader2, AlertCircle, Trash2, PowerOff, Power, Pencil, Clock, MapPin, Play, Square, ClipboardList, CheckCircle2 } from 'lucide-react'

// Funções no molde da Alfer (locação de munck/poliguindaste/caçambas/containers).
const CARGOS = [
  'Motorista',
  'Operador de Munck',
  'Operador de Poliguindaste',
  'Ajudante',
  'Auxiliar de Operações',
  'Mecânico',
  'Soldador',
  'Borracheiro',
  'Encarregado de Operações',
  'Supervisor de Operações',
  'Administrativo',
]

// Cargos que têm acesso ao app de campo (mesma regra do backend).
const CARGOS_COM_APP = ['Motorista', 'Operador de Munck', 'Operador de Poliguindaste']

export default function Motoristas() {
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAtivo, setFiltroAtivo] = useState('true')
  const [showNovo, setShowNovo] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [verJornadas, setVerJornadas] = useState<any>(null)
  const [verTarefas, setVerTarefas] = useState<any>(null)

  const [acaoErro, setAcaoErro] = useState('')
  const [acaoLoadingId, setAcaoLoadingId] = useState('')

  // Monitoramento de jornadas do dia (cronômetro + alertas de horário).
  const [monitor, setMonitor] = useState<any[]>([])
  const [agora, setAgora] = useState(Date.now())

  const load = () => {
    setLoading(true)
    api.get('/motoristas', { params: filtroAtivo !== '' ? { ativo: filtroAtivo } : {} })
      .then((r) => setMotoristas(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroAtivo])

  const carregarMonitor = () => {
    api.get('/jornadas/monitor-hoje').then((r) => setMonitor(r.data || [])).catch(() => {})
  }
  useEffect(() => {
    carregarMonitor()
    const t = setInterval(carregarMonitor, 60000) // refaz a cada 1min
    return () => clearInterval(t)
  }, [])

  // Tick de 1s pro cronômetro das jornadas em andamento.
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Mapa motoristaId → jornada relevante (prioriza a que está em aberto).
  const jornadaPorMotorista: Record<string, any> = {}
  for (const j of monitor) {
    const atual = jornadaPorMotorista[j.motoristaId]
    if (!atual) { jornadaPorMotorista[j.motoristaId] = j; continue }
    if (!j.dtFim && atual.dtFim) jornadaPorMotorista[j.motoristaId] = j // aberta ganha
  }

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
    if (!confirm(`Excluir DEFINITIVAMENTE o funcionário "${m.nome}"? Esta ação não pode ser desfeita.`)) return
    if (!confirm('Confirma de novo? Se houver histórico vinculado, a exclusão será bloqueada.')) return
    setAcaoErro('')
    setAcaoLoadingId(m.id)
    try {
      await api.delete(`/motoristas/${m.id}`)
      load()
    } catch (err: any) {
      setAcaoErro(err.response?.data?.message || 'Erro ao excluir funcionário.')
    } finally {
      setAcaoLoadingId('')
    }
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-gray-500 text-sm mt-1">{motoristas.length} funcionários cadastrados</p>
        </div>
        <button
          onClick={() => setShowNovo(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" />
          Novo funcionário
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
          <p>Nenhum funcionário encontrado</p>
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
                    {m.cargo && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#FEF3E2', color: '#633806' }}>{m.cargo}</span>}
                    {!m.ativo && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F1EFE8', color: '#888' }}>Inativo</span>}
                    {cnhVencendo && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#FEF3E2', color: '#633806' }}>CNH vencendo</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    {m.telefone && (<span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {m.telefone}</span>)}
                    {m.cnh && (<span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> CNH {m.cnh}</span>)}
                    {caminhao && <span>Caminhão: {caminhao.codigo} ({caminhao.placa})</span>}
                  </div>
                </div>
                <StatusJornada jornada={jornadaPorMotorista[m.id]} agora={agora} ativo={m.ativo} inicioPadrao={m.jornadaInicio} fimPadrao={m.jornadaFim} />
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setVerTarefas(m)}
                    title="Tarefas de pátio"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                    style={{ border: '1px solid #E0DDD8' }}
                  >
                    <ClipboardList className="w-3 h-3" /> Tarefas
                  </button>
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
      {verTarefas && <TarefasModal funcionario={verTarefas} onClose={() => setVerTarefas(null)} />}
    </div>
  )
}

// Chip de status da jornada do dia (cronômetro ao vivo + alertas de horário).
// Usa a jornada padrão cadastrada no motorista (HH:MM); cai pra 08:00/18:00 se vazio.
// Tolerância de 15 min antes de alertar atraso.
const TOLERANCIA_MIN = 15
function StatusJornada({ jornada, agora, ativo, inicioPadrao, fimPadrao }: {
  jornada: any; agora: number; ativo: boolean; inicioPadrao?: string | null; fimPadrao?: string | null
}) {
  if (!ativo) return null

  const horaPadrao = (hhmm: string | null | undefined, fallH: number, fallM: number) => {
    const d = new Date(agora)
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '')
    if (m) d.setHours(+m[1], +m[2], 0, 0)
    else d.setHours(fallH, fallM, 0, 0)
    return d
  }
  const limInicio = horaPadrao(inicioPadrao, 8, 0); limInicio.setMinutes(limInicio.getMinutes() + TOLERANCIA_MIN)
  const limFim = horaPadrao(fimPadrao, 18, 0); limFim.setMinutes(limFim.getMinutes() + TOLERANCIA_MIN)

  const fmtDur = (ms: number) => {
    const tot = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(tot / 3600)
    const m = Math.floor((tot % 3600) / 60)
    const s = tot % 60
    const pad = (n: number) => String(n).padStart(2, '0')
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  }

  // Sem jornada hoje.
  if (!jornada) {
    if (agora > limInicio.getTime()) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0" style={{ background: '#FDEEEE', color: '#C62828' }}>
          <AlertCircle className="w-3.5 h-3.5" /> Não iniciou
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0" style={{ background: '#F1EFE8', color: '#888' }}>
        <Clock className="w-3.5 h-3.5" /> Aguardando início
      </span>
    )
  }

  // Jornada em aberto → cronômetro ao vivo.
  if (!jornada.dtFim) {
    const decorrido = fmtDur(agora - new Date(jornada.dtInicio).getTime())
    const naoEncerrou = agora > limFim.getTime()
    const iniciouAtrasado = new Date(jornada.dtInicio).getTime() > limInicio.getTime()
    if (naoEncerrou) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 tabular-nums" style={{ background: '#FDEEEE', color: '#C62828' }}>
          <AlertCircle className="w-3.5 h-3.5" /> Não encerrou · {decorrido}
        </span>
      )
    }
    return (
      <span
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 tabular-nums"
        style={iniciouAtrasado ? { background: '#FEF3E2', color: '#B45309' } : { background: '#EAF3DE', color: '#27500A' }}
      >
        <Play className="w-3.5 h-3.5" /> {iniciouAtrasado ? 'Atrasada · ' : ''}{decorrido}
      </span>
    )
  }

  // Jornada encerrada hoje.
  const total = fmtDur(new Date(jornada.dtFim).getTime() - new Date(jornada.dtInicio).getTime())
  const foraHorario = new Date(jornada.dtInicio).getTime() > limInicio.getTime() || new Date(jornada.dtFim).getTime() > limFim.getTime()
  return (
    <span
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
      style={foraHorario ? { background: '#FEF3E2', color: '#B45309' } : { background: '#EAF3DE', color: '#27500A' }}
    >
      <Square className="w-3.5 h-3.5" /> Encerrada · {total}
    </span>
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

function TarefasModal({ funcionario, onClose }: { funcionario: any; onClose: () => void }) {
  const [tarefas, setTarefas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ titulo: '', descricao: '', local: '', prioridade: 'NORMAL' })

  const carregar = () => {
    setLoading(true)
    api.get('/tarefas', { params: { funcionarioId: funcionario.id } })
      .then((r) => setTarefas(r.data || []))
      .finally(() => setLoading(false))
  }
  useEffect(carregar, [funcionario.id])

  const criar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.titulo.trim()) return setErro('Informe o título da tarefa.')
    setSalvando(true)
    try {
      await api.post('/tarefas', { funcionarioId: funcionario.id, ...form })
      setForm({ titulo: '', descricao: '', local: '', prioridade: 'NORMAL' })
      carregar()
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao criar tarefa.')
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (t: any) => {
    if (!confirm(`Excluir a tarefa "${t.titulo}"?`)) return
    await api.post(`/tarefas/${t.id}/excluir`)
    carregar()
  }

  const STATUS: Record<string, { label: string; bg: string; cor: string }> = {
    PENDENTE: { label: 'Pendente', bg: '#F1EFE8', cor: '#888' },
    EM_ANDAMENTO: { label: 'Em andamento', bg: '#FEF3E2', cor: '#633806' },
    CONCLUIDA: { label: 'Concluída', bg: '#EAF3DE', cor: '#27500A' },
  }
  const PRIO: Record<string, string> = { ALTA: 'Alta', NORMAL: 'Normal', BAIXA: 'Baixa' }
  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5" style={{ color: '#FFAF06' }} /> Tarefas
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{funcionario.nome} · #{funcionario.matricula}</p>
        </div>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>

      <form onSubmit={criar} className="space-y-2 rounded-xl border p-3 mb-4" style={{ borderColor: '#E0DDD8', background: '#FBFAF7' }}>
        <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título da tarefa *" className={inputCls} style={inputStyle} />
        <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} placeholder="Descrição (opcional)" className={inputCls} style={inputStyle} />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="Local / referência" className={inputCls} style={inputStyle} />
          <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })} className={inputCls} style={inputStyle}>
            <option value="BAIXA">Prioridade baixa</option>
            <option value="NORMAL">Prioridade normal</option>
            <option value="ALTA">Prioridade alta</option>
          </select>
        </div>
        {erro && <div className="text-xs text-red-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {erro}</div>}
        <button type="submit" disabled={salvando} className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: salvando ? '#CC8C00' : '#FFAF06' }}>
          {salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Atribuir tarefa
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : tarefas.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" /> Nenhuma tarefa atribuída.
        </div>
      ) : (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {tarefas.map((t) => {
            const st = STATUS[t.status] || STATUS.PENDENTE
            return (
              <div key={t.id} className="rounded-xl border p-3" style={{ borderColor: '#E0DDD8' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">{t.titulo}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.cor }}>{st.label}</span>
                      {t.prioridade === 'ALTA' && <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#FDEEEE', color: '#C62828' }}>Alta</span>}
                    </div>
                    {t.descricao && <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{t.descricao}</div>}
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                      {t.local && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.local}</span>}
                      {t.prioridade !== 'ALTA' && <span>Prioridade: {PRIO[t.prioridade] || t.prioridade}</span>}
                      {t.status === 'CONCLUIDA' && t.dtConclusao && (
                        <span className="flex items-center gap-1" style={{ color: '#27500A' }}>
                          <CheckCircle2 className="w-3 h-3" /> {new Date(t.dtConclusao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {t.observacao && <div className="text-xs text-gray-500 mt-1 italic">"{t.observacao}"</div>}
                  </div>
                  <button onClick={() => excluir(t)} title="Excluir" className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

function MotoristaModal({ motorista, onClose, onSuccess }: { motorista?: any; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!motorista
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const d = (s: any) => (s ? new Date(s).toISOString().slice(0, 10) : '')
  const [form, setForm] = useState({
    nome: motorista?.nome || '',
    matricula: motorista?.matricula || '',
    pin: '',
    cargo: motorista?.cargo || '',
    telefone: motorista?.telefone || '',
    email: motorista?.email || '',
    cpf: motorista?.cpf || '',
    rg: motorista?.rg || '',
    dataNascimento: d(motorista?.dataNascimento),
    dataAdmissao: d(motorista?.dataAdmissao),
    cnh: motorista?.cnh || '',
    cnhCategoria: motorista?.cnhCategoria || '',
    cnhValida: d(motorista?.cnhValida),
    endereco: motorista?.endereco || '',
    cidade: motorista?.cidade || '',
    uf: motorista?.uf || '',
    contatoEmergenciaNome: motorista?.contatoEmergenciaNome || '',
    contatoEmergenciaTelefone: motorista?.contatoEmergenciaTelefone || '',
    observacoes: motorista?.observacoes || '',
    jornadaInicio: motorista?.jornadaInicio || '',
    jornadaFim: motorista?.jornadaFim || '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.nome || !form.matricula) return setErro('Nome e matrícula são obrigatórios.')
    if (!isEdit && !form.pin) return setErro('PIN é obrigatório no cadastro.')
    if (form.pin && form.pin.length < 4) return setErro('PIN deve ter pelo menos 4 dígitos.')
    setLoading(true)
    try {
      const payload: any = { ...form }
      delete payload.pin
      for (const k of Object.keys(payload)) if (payload[k] === '') payload[k] = null
      if (form.pin) payload.pin = form.pin
      if (isEdit) {
        await api.put(`/motoristas/${motorista.id}`, payload)
      } else {
        await api.post('/motoristas', payload)
      }
      onSuccess()
    } catch (err: any) {
      setErro(err.response?.data?.message || `Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} funcionário.`)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }
  const Campo = ({ label, k, ...rest }: { label: string; k: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input value={(form as any)[k]} onChange={(e) => set(k, e.target.value)} className={inputCls} style={inputStyle} {...rest} />
    </div>
  )
  const Secao = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="pt-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">{isEdit ? 'Editar funcionário' : 'Novo funcionário'}</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <form onSubmit={submit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

        <Secao title="Dados pessoais">
          <Campo label="Nome completo *" k="nome" required />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="CPF" k="cpf" placeholder="000.000.000-00" />
            <Campo label="RG" k="rg" placeholder="Número" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Data de nascimento" k="dataNascimento" type="date" />
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cargo / função</label>
              <select value={form.cargo} onChange={(e) => set('cargo', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">Selecione…</option>
                {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {form.cargo && !CARGOS_COM_APP.includes(form.cargo) && (
            <p className="text-[11px] text-amber-700 flex items-center gap-1 -mt-1">
              <AlertCircle className="w-3 h-3" /> Sem acesso ao app. Só motoristas e operadores fazem login com o PIN.
            </p>
          )}
        </Secao>

        <Secao title="Contato">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Telefone" k="telefone" placeholder="(81) 9 0000-0000" />
            <Campo label="E-mail" k="email" type="email" placeholder="email@exemplo.com" />
          </div>
          <Campo label="Endereço" k="endereco" placeholder="Rua, número, bairro" />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Campo label="Cidade" k="cidade" /></div>
            <Campo label="UF" k="uf" maxLength={2} placeholder="PE" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Contato de emergência" k="contatoEmergenciaNome" placeholder="Nome" />
            <Campo label="Telefone de emergência" k="contatoEmergenciaTelefone" placeholder="(81) 9 0000-0000" />
          </div>
        </Secao>

        <Secao title="CNH">
          <div className="grid grid-cols-3 gap-3">
            <Campo label="Número" k="cnh" />
            <Campo label="Categoria" k="cnhCategoria" placeholder="D, E…" />
            <Campo label="Válida até" k="cnhValida" type="date" />
          </div>
        </Secao>

        <Secao title="Vínculo e acesso">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Matrícula *" k="matricula" required placeholder="MOT-001" />
            <Campo label="Data de admissão" k="dataAdmissao" type="date" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">PIN (login app) {isEdit ? '' : '*'}</label>
            <input
              value={form.pin}
              onChange={(e) => set('pin', e.target.value)}
              required={!isEdit}
              maxLength={6}
              placeholder={isEdit ? 'Deixe em branco para manter' : '4-6 dígitos'}
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Jornada padrão (horário de trabalho)</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-10">Início</span>
                <input value={form.jornadaInicio} onChange={(e) => set('jornadaInicio', e.target.value)} type="time" className={inputCls} style={inputStyle} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-10">Fim</span>
                <input value={form.jornadaFim} onChange={(e) => set('jornadaFim', e.target.value)} type="time" className={inputCls} style={inputStyle} />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Usado pra alertar atraso na tela de funcionários (tolerância de 15 min). Em branco usa 08:00–18:00.</p>
          </div>
        </Secao>

        <Secao title="Observações">
          <textarea
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
            rows={3}
            placeholder="Anotações internas sobre o funcionário"
            className={inputCls}
            style={inputStyle}
          />
        </Secao>

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
