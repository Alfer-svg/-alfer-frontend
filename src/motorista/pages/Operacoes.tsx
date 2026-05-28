import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiMotorista from '../api'
import { ClipboardList, ChevronRight, MapPin, Clock, CheckCircle2, Truck, FileText } from 'lucide-react'

const TIPO_LABEL: Record<string, string> = {
  ENTREGA: 'Entrega',
  RETIRADA: 'Retirada',
  TROCA: 'Troca',
  SERVICO_AVULSO: 'Serviço avulso',
  MOBILIZACAO: 'Mobilização',
  DESMOBILIZACAO: 'Desmobilização',
  MANUTENCAO: 'Manutenção',
}

const TIPO_MOV_POLI: Record<string, string> = {
  ENTREGA_VAZIA: 'Entrega de caçamba',
  COLETA_CHEIA: 'Coleta de caçamba',
  TROCA: 'Troca de caçamba',
  TRANSPORTE_DESTINO: 'Transporte ao destino',
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  AGENDADA: { bg: '#FEF3E2', text: '#633806', label: 'Pendente' },
  EM_ROTA: { bg: '#E3EEFA', text: '#1A5276', label: 'Em rota' },
  CONCLUIDA: { bg: '#E8F5E9', text: '#2D7D32', label: 'Concluída' },
  CANCELADA: { bg: '#F1EFE8', text: '#888', label: 'Cancelada' },
  // Status OS Munck/Poli
  RASCUNHO: { bg: '#FEF3E2', text: '#633806', label: 'Pendente' },
  EM_ANDAMENTO: { bg: '#E3EEFA', text: '#1A5276', label: 'Em andamento' },
}

const KIND_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  OS_MUNCK: { bg: '#EDE7F6', text: '#4527A0', label: 'OS Munck' },
  OS_POLI: { bg: '#E0F2F1', text: '#00695C', label: 'OS Poli' },
}

interface ItemFila {
  __kind: 'OPERACAO' | 'OS_MUNCK' | 'OS_POLI'
  id: string
  status: string
  // Operacao
  tipo?: string
  clienteNome?: string
  endDestino?: string
  dtAgendada?: string
  horaAgendada?: string
  dtConclusao?: string
  // OS
  numero?: string
  dtHora?: string
  cliente?: { razaoSocial: string }
  endereco?: string
  enderecoOrigem?: string
  enderecoDestino?: string
  servicoTipos?: string[]
  tipoMovimento?: string
  descricaoOperacional?: string
}

function normalizar(item: ItemFila) {
  if (item.__kind === 'OPERACAO') {
    return {
      titulo: TIPO_LABEL[item.tipo!] || item.tipo!,
      cliente: item.clienteNome || '',
      endereco: item.endDestino || '',
      hora: item.horaAgendada || (item.dtAgendada ? new Date(item.dtAgendada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''),
      kindLabel: null as { bg: string; text: string; label: string } | null,
    }
  }
  if (item.__kind === 'OS_MUNCK') {
    const tipos = (item.servicoTipos || []).join(', ') || 'Serviço'
    return {
      titulo: `${tipos} · OS ${item.numero}`,
      cliente: item.cliente?.razaoSocial || '',
      endereco: item.endereco || '',
      hora: item.dtHora ? new Date(item.dtHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
      kindLabel: KIND_BADGE.OS_MUNCK,
    }
  }
  // OS_POLI
  return {
    titulo: `${TIPO_MOV_POLI[item.tipoMovimento!] || item.tipoMovimento!} · OS ${item.numero}`,
    cliente: item.cliente?.razaoSocial || '',
    endereco: item.enderecoOrigem || item.enderecoDestino || '',
    hora: item.dtHora ? new Date(item.dtHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
    kindLabel: KIND_BADGE.OS_POLI,
  }
}

const STATUS_PENDENTES = new Set(['AGENDADA', 'EM_ROTA', 'RASCUNHO', 'EM_ANDAMENTO'])

export default function MotoristaOperacoes() {
  const [itens, setItens] = useState<ItemFila[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    apiMotorista.get('/motorista-app/me/operacoes-hoje')
      .then((r) => setItens(r.data || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const pendentes = itens.filter((o) => STATUS_PENDENTES.has(o.status))
  const concluidas = itens.filter((o) => !STATUS_PENDENTES.has(o.status))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Trabalhos de hoje</h1>
        <p className="text-sm text-gray-500 mt-1">
          {itens.length === 0
            ? 'Nenhum trabalho atribuído'
            : `${pendentes.length} pendente${pendentes.length === 1 ? '' : 's'} · ${concluidas.length} concluído${concluidas.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {itens.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            Quando o gestor atribuir operações ou OSs, elas aparecem aqui.
          </p>
        </div>
      )}

      {pendentes.length > 0 && (
        <section className="space-y-3">
          {pendentes.map((it) => (
            <ItemCard
              key={`${it.__kind}-${it.id}`}
              item={it}
              onClick={() => {
                if (it.__kind === 'OPERACAO') navigate(`/m/operacoes/${it.id}`)
                else navigate(`/m/os/${it.__kind === 'OS_MUNCK' ? 'munck' : 'poli'}/${it.id}`)
              }}
            />
          ))}
        </section>
      )}

      {concluidas.length > 0 && (
        <section>
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Concluídos
          </div>
          <div className="space-y-3 opacity-70">
            {concluidas.map((it) => (
              <ItemCard
                key={`${it.__kind}-${it.id}`}
                item={it}
                onClick={() => {
                  if (it.__kind === 'OPERACAO') navigate(`/m/operacoes/${it.id}`)
                  else navigate(`/m/os/${it.__kind === 'OS_MUNCK' ? 'munck' : 'poli'}/${it.id}`)
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ItemCard({ item, onClick }: { item: ItemFila; onClick: () => void }) {
  const status = STATUS_BADGE[item.status] || STATUS_BADGE.AGENDADA
  const dados = normalizar(item)
  const isOS = item.__kind !== 'OPERACAO'

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
          {item.status === 'CONCLUIDA' || item.status === 'CANCELADA' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : isOS ? (
            <FileText className="w-5 h-5" style={{ color: '#FFAF06' }} />
          ) : (
            <Truck className="w-5 h-5" style={{ color: '#FFAF06' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 truncate">{dados.titulo}</span>
            {dados.kindLabel && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                style={{ background: dados.kindLabel.bg, color: dados.kindLabel.text }}
              >
                {dados.kindLabel.label}
              </span>
            )}
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
              style={{ background: status.bg, color: status.text }}
            >
              {status.label}
            </span>
          </div>
          {dados.cliente && (
            <div className="text-sm text-gray-700 truncate">{dados.cliente}</div>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
            {dados.hora && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dados.hora}
              </span>
            )}
            {dados.endereco && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{dados.endereco}</span>
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-2" />
      </div>
    </button>
  )
}
