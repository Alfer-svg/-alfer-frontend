import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Modal } from '../components/Modal'
import {
  Layers, Package, Truck, Container, FileSignature, MapPin, Calendar,
  RotateCcw, XCircle, ChevronRight, AlertCircle, Loader2, X,
} from 'lucide-react'

type Locacao = {
  key: string
  id: string
  tipo: 'CONTRATO' | 'CACAMBA_REMOVIVEL'
  subtipo: string
  numero: string
  cliente: { id: string; razaoSocial: string } | null
  equipamentos: { id: string; codigo: string; modelo: string }[]
  endereco: string | null
  dtInicio: string
  dtFim: string | null
  diasRestantes: number | null
  status: string
  valor: number | null
  periodicidade: string
  podeRenovar: boolean
  podeEncerrar: boolean
}

const fmt = (v: number | null) =>
  v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

const subtipoLabel: Record<string, string> = {
  CONTAINER_SECO: 'Container Seco',
  CONTAINER_REEFER: 'Container Reefer',
  CACAMBA_ESTACIONARIA: 'Caçamba Estacionária',
  CAMINHAO_MUNCK: 'Caminhão Munck',
  CAMINHAO_POLIGUINDASTE: 'Caminhão Poliguindaste',
  CAMINHAO_CAVALO_MECANICO: 'Caminhão Cavalo Mecânico',
  CACAMBA: 'Caçamba Removível',
}

const subtipoIcon: Record<string, any> = {
  CONTAINER_SECO: Container,
  CONTAINER_REEFER: Container,
  CACAMBA_ESTACIONARIA: Package,
  CAMINHAO_MUNCK: Truck,
  CAMINHAO_POLIGUINDASTE: Truck,
  CAMINHAO_CAVALO_MECANICO: Truck,
  CACAMBA: Layers,
}

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  ATIVO: { bg: '#EAF3DE', text: '#27500A', label: 'Ativo' },
  VENCENDO: { bg: '#FFF3D6', text: '#A77400', label: 'Vencendo' },
  ENCERRADO: { bg: '#F1EFE8', text: '#888', label: 'Encerrado' },
  RESCINDIDO: { bg: '#FDEEEE', text: '#8B0000', label: 'Rescindido' },
  RASCUNHO: { bg: '#F1EFE8', text: '#888', label: 'Rascunho' },
  AGUARDANDO_ASSINATURA: { bg: '#E3EEFA', text: '#1A5276', label: 'Aguardando assinatura' },
  ATIVA: { bg: '#EAF3DE', text: '#27500A', label: 'Ativa' },
  CHEIA: { bg: '#FFF3D6', text: '#A77400', label: 'Cheia' },
  ENCERRADA: { bg: '#F1EFE8', text: '#888', label: 'Encerrada' },
}

export default function Locacoes() {
  const navigate = useNavigate()
  const [itens, setItens] = useState<Locacao[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('ATIVOS')
  const [erro, setErro] = useState('')
  const [renovarModal, setRenovarModal] = useState<Locacao | null>(null)

  const load = () => {
    setLoading(true)
    const params: any = {}
    if (filtroTipo) params.tipo = filtroTipo
    if (filtroStatus) params.status = filtroStatus
    api
      .get('/locacoes', { params })
      .then((r) => setItens(r.data))
      .catch((e) => setErro(e.response?.data?.message || 'Erro ao carregar locações'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroTipo, filtroStatus])

  const encerrar = async (l: Locacao) => {
    if (!confirm(`Encerrar esta locação${l.cliente ? ' de ' + l.cliente.razaoSocial : ''}?`)) return
    setErro('')
    try {
      if (l.tipo === 'CONTRATO') {
        await api.put(`/contratos/${l.id}/status`, { status: 'ENCERRADO' })
      } else {
        await api.put(`/cacambas/locacoes/${l.id}/encerrar`)
      }
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao encerrar locação.')
    }
  }

  const ativos = itens.filter((i) => ['ATIVO', 'ATIVA', 'VENCENDO', 'CHEIA'].includes(i.status))

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Locações</h1>
          <p className="text-gray-500 text-sm mt-1">
            {ativos.length} locação(ões) em andamento — renove ou encerre direto daqui
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos os tipos</option>
          <option value="CONTRATO">Contratos (containers, munck, guindaste...)</option>
          <option value="CACAMBA_REMOVIVEL">Caçambas removíveis</option>
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="ATIVOS">Em andamento (padrão)</option>
          <option value="TODOS">Todos os status</option>
          <option value="ATIVO">Só Ativo</option>
          <option value="VENCENDO">Só Vencendo</option>
          <option value="ENCERRADO">Só Encerrado</option>
          <option value="RESCINDIDO">Só Rescindido</option>
          <option value="CHEIA">Só Cheia (caçambas)</option>
          <option value="ENCERRADA">Só Encerrada (caçambas)</option>
        </select>
      </div>

      {erro && (
        <div
          className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2"
          style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : itens.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma locação encontrada com esses filtros</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {itens.map((l) => {
            const Icon = subtipoIcon[l.subtipo] || Package
            const st = statusColor[l.status] || { bg: '#F1EFE8', text: '#666', label: l.status }
            const vencido = l.diasRestantes != null && l.diasRestantes < 0
            const vencendoEm = l.diasRestantes != null && l.diasRestantes >= 0 && l.diasRestantes <= 7

            return (
              <div
                key={l.key}
                className="bg-white rounded-2xl p-5 animate-fade-in"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#FEF3E2' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: '#FFAF06' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{l.numero}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: st.bg, color: st.text }}
                      >
                        {st.label}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: '#F1EFE8', color: '#666' }}
                      >
                        {subtipoLabel[l.subtipo] || l.subtipo}
                      </span>
                      {vencido && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#FDEEEE', color: '#8B0000' }}
                        >
                          Vencido há {Math.abs(l.diasRestantes!)}d
                        </span>
                      )}
                      {vencendoEm && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#FFF3D6', color: '#A77400' }}
                        >
                          Vence em {l.diasRestantes}d
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap mb-2">
                      <span className="font-medium text-gray-700">{l.cliente?.razaoSocial || '—'}</span>
                      {l.equipamentos.length > 0 && (
                        <span>
                          {l.equipamentos.length === 1
                            ? `${l.equipamentos[0].codigo} — ${l.equipamentos[0].modelo}`
                            : `${l.equipamentos.length} equipamentos`}
                        </span>
                      )}
                      {l.endereco && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {l.endereco}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(l.dtInicio)} → {fmtDate(l.dtFim)}
                      </span>
                      {l.valor != null && <span className="font-medium text-gray-700">{fmt(l.valor)} / {l.periodicidade}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                    {l.tipo === 'CONTRATO' && (
                      <button
                        onClick={() => navigate(`/contratos/${l.id}`)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
                      >
                        Detalhes <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {(l.podeRenovar || l.podeEncerrar) && (
                  <div className="flex gap-2 mt-4 pt-4 border-t flex-wrap" style={{ borderColor: '#F1EFE8' }}>
                    {l.podeRenovar && (
                      <button
                        onClick={() => setRenovarModal(l)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: '#FFF8E6', color: '#FFAF06' }}
                      >
                        <RotateCcw className="w-3 h-3" /> Renovar
                      </button>
                    )}
                    {l.podeEncerrar && (
                      <button
                        onClick={() => encerrar(l)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                        style={{ border: '1px solid #E0DDD8' }}
                      >
                        <XCircle className="w-3 h-3" /> Encerrar
                      </button>
                    )}
                    {l.tipo === 'CACAMBA_REMOVIVEL' && (
                      <button
                        onClick={() => navigate('/cacambas')}
                        className="flex items-center gap-1 text-xs text-gray-500 ml-auto hover:text-gray-900"
                      >
                        Ver no módulo Caçambas <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {renovarModal && (
        <RenovarModal
          locacao={renovarModal}
          onClose={() => setRenovarModal(null)}
          onSaved={() => {
            setRenovarModal(null)
            load()
          }}
          onError={(m) => setErro(m)}
        />
      )}
    </div>
  )
}

function RenovarModal({
  locacao,
  onClose,
  onSaved,
  onError,
}: {
  locacao: Locacao
  onClose: () => void
  onSaved: () => void
  onError: (m: string) => void
}) {
  const [salvando, setSalvando] = useState(false)
  const hoje = new Date()
  const sugestao = new Date(hoje.getFullYear(), hoje.getMonth() + 12, hoje.getDate())
  const [novaDtFim, setNovaDtFim] = useState(sugestao.toISOString().slice(0, 10))
  const [novoValor, setNovoValor] = useState(String(locacao.valor ?? 0))
  const [reajusteAplicado, setReajusteAplicado] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      await api.post(`/contratos/${locacao.id}/renovar`, {
        novaDtFim,
        novoValor: Number(novoValor),
        reajusteAplicado,
        observacoes,
      })
      onSaved()
    } catch (err: any) {
      onError(err.response?.data?.message || 'Erro ao renovar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-gray-900">Renovar {locacao.numero}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{locacao.cliente?.razaoSocial}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Nova data de fim</label>
            <input
              type="date"
              value={novaDtFim}
              onChange={(e) => setNovaDtFim(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white rounded-lg text-sm outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Novo valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={novoValor}
              onChange={(e) => setNovoValor(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white rounded-lg text-sm outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Reajuste aplicado (opcional)</label>
            <input
              type="text"
              value={reajusteAplicado}
              onChange={(e) => setReajusteAplicado(e.target.value)}
              placeholder="Ex: IGPM 4.8%"
              className="w-full px-3 py-2 bg-white rounded-lg text-sm outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white rounded-lg text-sm outline-none resize-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              style={{ border: '1px solid #E0DDD8' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium disabled:opacity-50"
              style={{ background: '#FFAF06' }}
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Confirmar renovação
            </button>
          </div>
        </form>
    </Modal>
  )
}
