import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiMotorista from '../api'
import {
  ClipboardList, ChevronRight, Clock, Play, CheckCircle2, Loader2, MapPin, AlertCircle,
} from 'lucide-react'

type Tarefa = {
  id: string
  titulo: string
  descricao?: string | null
  local?: string | null
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA'
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA'
  dtConclusao?: string | null
}

const PRIO: Record<string, { label: string; bg: string; cor: string }> = {
  ALTA: { label: 'Alta', bg: '#FDEEEE', cor: '#C62828' },
  NORMAL: { label: 'Normal', bg: '#FEF3E2', cor: '#633806' },
  BAIXA: { label: 'Baixa', bg: '#F1EFE8', cor: '#888' },
}

export default function MotoristaTarefas() {
  const navigate = useNavigate()
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [acaoId, setAcaoId] = useState('')
  const [jornadaAberta, setJornadaAberta] = useState<any>(null)

  const carregar = async () => {
    try {
      const [t, j] = await Promise.all([
        apiMotorista.get('/motorista-app/me/tarefas'),
        apiMotorista.get('/motorista-app/me/jornada-aberta').catch(() => ({ data: null })),
      ])
      setTarefas(t.data || [])
      setJornadaAberta(j.data || null)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { carregar() }, [])

  const iniciar = async (t: Tarefa) => {
    setAcaoId(t.id)
    try {
      await apiMotorista.post(`/motorista-app/tarefa/${t.id}/iniciar`)
      await carregar()
    } finally { setAcaoId('') }
  }

  const concluir = async (t: Tarefa) => {
    const obs = window.prompt('Concluir tarefa. Quer deixar alguma observação? (opcional)') ?? ''
    setAcaoId(t.id)
    try {
      await apiMotorista.post(`/motorista-app/tarefa/${t.id}/concluir`, { observacao: obs || null })
      await carregar()
    } finally { setAcaoId('') }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const pendentes = tarefas.filter((t) => t.status !== 'CONCLUIDA')
  const concluidas = tarefas.filter((t) => t.status === 'CONCLUIDA')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-6 h-6" style={{ color: '#FFAF06' }} />
        <h1 className="text-xl font-bold text-gray-900">Minhas tarefas</h1>
      </div>

      {/* Ponto */}
      <button
        onClick={() => navigate('/m/jornada')}
        className="w-full py-4 rounded-2xl bg-white border flex items-center gap-3 px-5 active:bg-gray-50"
        style={{ borderColor: jornadaAberta ? '#C8E6C9' : '#E0DDD8' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: jornadaAberta ? '#E8F5E9' : '#FEF3E2' }}
        >
          <Clock className="w-5 h-5" style={{ color: jornadaAberta ? '#2D7D32' : '#FFAF06' }} />
        </div>
        <div className="text-left flex-1">
          <div className="font-semibold text-gray-900">{jornadaAberta ? 'Encerrar jornada' : 'Iniciar jornada'}</div>
          <div className="text-xs text-gray-500 mt-0.5">{jornadaAberta ? 'Jornada em andamento' : 'Bater o ponto'}</div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {pendentes.length === 0 && concluidas.length === 0 && (
        <div className="rounded-2xl bg-white border p-8 text-center" style={{ borderColor: '#E0DDD8' }}>
          <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <div className="font-medium text-gray-900 mb-1">Nenhuma tarefa por enquanto</div>
          <div className="text-sm text-gray-500">Quando o gestor atribuir tarefas, elas aparecem aqui.</div>
        </div>
      )}

      {pendentes.map((t) => {
        const prio = PRIO[t.prioridade] || PRIO.NORMAL
        const emAndamento = t.status === 'EM_ANDAMENTO'
        return (
          <div
            key={t.id}
            className="rounded-2xl bg-white border p-5"
            style={{ borderColor: emAndamento ? '#C8E6C9' : '#E0DDD8' }}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="font-semibold text-gray-900">{t.titulo}</div>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: prio.bg, color: prio.cor }}>
                {prio.label}
              </span>
            </div>
            {t.descricao && <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{t.descricao}</div>}
            {t.local && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                <MapPin className="w-3.5 h-3.5" /> {t.local}
              </div>
            )}
            {emAndamento && (
              <div className="flex items-center gap-1 text-xs font-medium mb-3" style={{ color: '#2D7D32' }}>
                <Play className="w-3.5 h-3.5" /> Em andamento
              </div>
            )}

            {emAndamento ? (
              <button
                onClick={() => concluir(t)}
                disabled={acaoId === t.id}
                className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 active:opacity-80"
                style={{ background: '#2D7D32' }}
              >
                {acaoId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Concluir tarefa
              </button>
            ) : (
              <button
                onClick={() => iniciar(t)}
                disabled={acaoId === t.id}
                className="w-full py-3 rounded-xl font-semibold text-gray-900 flex items-center justify-center gap-2 disabled:opacity-60 active:opacity-80"
                style={{ background: '#FFAF06' }}
              >
                {acaoId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Iniciar tarefa
              </button>
            )}
          </div>
        )
      })}

      {concluidas.length > 0 && (
        <div className="pt-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Concluídas hoje</div>
          <div className="space-y-2">
            {concluidas.map((t) => (
              <div key={t.id} className="rounded-xl border p-3.5 flex items-center gap-3" style={{ background: '#F6FBF2', borderColor: '#C8E6C9' }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#2D7D32' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{t.titulo}</div>
                  {t.dtConclusao && (
                    <div className="text-xs text-gray-500">
                      Concluída às {new Date(t.dtConclusao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-400 flex items-center gap-1 pt-2">
        <AlertCircle className="w-3 h-3" /> As tarefas são atribuídas pelo gestor.
      </p>
    </div>
  )
}
