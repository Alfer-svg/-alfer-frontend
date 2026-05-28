import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiMotorista from '../api'
import { ClipboardList, ChevronRight, MapPin, Clock, CheckCircle2, Truck } from 'lucide-react'

const TIPO_LABEL: Record<string, string> = {
  ENTREGA_CONTAINER: 'Entrega de container',
  COLETA_CONTAINER: 'Coleta de container',
  TROCA_CONTAINER: 'Troca de container',
  MOVIMENTACAO_CONTAINER: 'Movimentação de container',
  ENTREGA_CACAMBA: 'Entrega de caçamba',
  COLETA_CACAMBA: 'Coleta de caçamba',
  TROCA_CACAMBA: 'Troca de caçamba',
  SERVICO_AVULSO: 'Serviço avulso',
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  AGENDADA: { bg: '#FEF3E2', text: '#633806', label: 'Pendente' },
  EM_ROTA: { bg: '#E3EEFA', text: '#1A5276', label: 'Em rota' },
  CONCLUIDA: { bg: '#E8F5E9', text: '#2D7D32', label: 'Concluída' },
  CANCELADA: { bg: '#F1EFE8', text: '#888', label: 'Cancelada' },
}

export default function MotoristaOperacoes() {
  const [operacoes, setOperacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    apiMotorista.get('/motorista-app/me/operacoes-hoje')
      .then((r) => setOperacoes(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const pendentes = operacoes.filter((o) => o.status !== 'CONCLUIDA' && o.status !== 'CANCELADA')
  const concluidas = operacoes.filter((o) => o.status === 'CONCLUIDA' || o.status === 'CANCELADA')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Operações de hoje</h1>
        <p className="text-sm text-gray-500 mt-1">
          {operacoes.length === 0
            ? 'Nenhuma operação atribuída'
            : `${pendentes.length} pendente${pendentes.length === 1 ? '' : 's'} · ${concluidas.length} concluída${concluidas.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {operacoes.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            Quando o gestor atribuir operações, elas aparecem aqui.
          </p>
        </div>
      )}

      {pendentes.length > 0 && (
        <section className="space-y-3">
          {pendentes.map((op) => (
            <OperacaoCard key={op.id} op={op} onClick={() => navigate(`/m/operacoes/${op.id}`)} />
          ))}
        </section>
      )}

      {concluidas.length > 0 && (
        <section>
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Concluídas
          </div>
          <div className="space-y-3 opacity-70">
            {concluidas.map((op) => (
              <OperacaoCard key={op.id} op={op} onClick={() => navigate(`/m/operacoes/${op.id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function OperacaoCard({ op, onClick }: { op: any; onClick: () => void }) {
  const status = STATUS_BADGE[op.status] || STATUS_BADGE.AGENDADA
  const tipo = TIPO_LABEL[op.tipo] || op.tipo

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border p-4 active:bg-gray-50"
      style={{ borderColor: '#E0DDD8' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#FEF3E2' }}
        >
          {op.status === 'CONCLUIDA' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Truck className="w-5 h-5" style={{ color: '#FFAF06' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900 truncate">{tipo}</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
              style={{ background: status.bg, color: status.text }}
            >
              {status.label}
            </span>
          </div>
          {op.clienteNome && (
            <div className="text-sm text-gray-700 truncate">{op.clienteNome}</div>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
            {op.horaAgendada && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {op.horaAgendada}
              </span>
            )}
            {op.endDestino && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{op.endDestino}</span>
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-2" />
      </div>
    </button>
  )
}
