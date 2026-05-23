import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Truck, Search, Plus, ChevronRight, Gauge, User, Pencil, Trash2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'

const tipoLabel: Record<string, string> = {
  MUNCK: 'Munck',
  POLIGUINDASTE: 'Poliguindaste',
  CAVALO_MECANICO: 'Cavalo Mecânico',
}

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  DISPONIVEL: { bg: '#EAF3DE', text: '#27500A', label: 'Disponível' },
  EM_OPERACAO: { bg: '#E3EEFA', text: '#1A5276', label: 'Em operação' },
  MANUTENCAO: { bg: '#FEF3E2', text: '#633806', label: 'Manutenção' },
}

export default function Caminhoes() {
  const navigate = useNavigate()
  const [caminhoes, setCaminhoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [sincronizando, setSincronizando] = useState(false)

  const sincronizarMunck = async () => {
    if (!confirm('Vai criar caminhões pra todos os equipamentos tipo CAMINHÃO MUNCK que ainda não têm registro aqui. Equipamentos com caminhão já existente são ignorados. Continuar?')) return
    setSincronizando(true); setErroAcao('')
    try {
      const r = await api.post('/caminhoes/sincronizar-munck')
      alert(`✓ Resultado:\n• Total de Munck no Equipamentos: ${r.data.total}\n• Caminhões criados agora: ${r.data.criados}\n• Já existiam: ${r.data.jaExistiam}`)
      load()
    } catch (e: any) {
      setErroAcao(e.response?.data?.message || 'Erro ao sincronizar')
    } finally {
      setSincronizando(false)
    }
  }

  const load = () => {
    setLoading(true)
    const params: any = {}
    if (filtroTipo) params.tipo = filtroTipo
    if (filtroStatus) params.status = filtroStatus
    api.get('/caminhoes', { params })
      .then((r) => setCaminhoes(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroTipo, filtroStatus])

  const excluir = async (e: React.MouseEvent, c: any) => {
    e.stopPropagation()
    if (!confirm(`Excluir o caminhão ${c.codigo}${c.placa ? ' (' + c.placa + ')' : ''}? Esta ação não pode ser desfeita.`)) return
    setErroAcao('')
    try {
      await api.delete(`/caminhoes/${c.id}`)
      load()
    } catch (err: any) {
      const msg = err.response?.data?.message || ''
      if (/histórico|histórico|force/i.test(msg)) {
        if (!confirm(`${msg}\n\nDeseja FORÇAR a exclusão? Vai apagar alocações de motorista, manutenções, documentos e operações vinculadas. OS Munck serão preservadas (só desvinculadas).`)) {
          setErroAcao('Exclusão cancelada.')
          return
        }
        try {
          await api.delete(`/caminhoes/${c.id}?force=true`)
          load()
        } catch (err2: any) {
          setErroAcao(err2.response?.data?.message || 'Erro ao forçar exclusão.')
        }
      } else {
        setErroAcao(msg || 'Erro ao excluir caminhão.')
      }
    }
  }

  const filtered = caminhoes.filter((c) =>
    !busca ||
    c.codigo?.toLowerCase().includes(busca.toLowerCase()) ||
    c.placa?.toLowerCase().includes(busca.toLowerCase()) ||
    c.modelo?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Caminhões</h1>
          <p className="text-gray-500 text-sm mt-1">{caminhoes.length} caminhões na frota</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={sincronizarMunck}
            disabled={sincronizando}
            title="Cria caminhão pra cada Equipamento tipo MUNCK que ainda não tem um (útil pra cadastros antigos)"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
            style={{ border: '1px solid #E0DDD8' }}
          >
            {sincronizando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sincronizar Munck
          </button>
          <button
            onClick={() => navigate('/caminhoes/novo')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
            style={{ background: '#FFAF06' }}
          >
            <Plus className="w-4 h-4" />
            Novo caminhão
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por código, placa ou modelo..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl text-sm outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(tipoLabel).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos os status</option>
          <option value="DISPONIVEL">Disponíveis</option>
          <option value="EM_OPERACAO">Em operação</option>
          <option value="MANUTENCAO">Em manutenção</option>
        </select>
      </div>

      {erroAcao && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erroAcao}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum caminhão encontrado</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {filtered.map((c) => {
            const status = statusColor[c.status] || statusColor.DISPONIVEL
            const motorista = c.motoristasAlocados?.[0]?.motorista
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/caminhoes/${c.id}`)}
                className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all animate-fade-in"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
                  <Truck className="w-5 h-5" style={{ color: '#FFAF06' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{c.codigo}</span>
                    <span className="text-sm text-gray-700">{c.placa}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: status.bg, color: status.text }}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <span>{tipoLabel[c.tipo] || c.tipo}</span>
                    <span>{c.modelo}</span>
                    <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> {c.kmAtual?.toLocaleString('pt-BR')} km</span>
                    {motorista && (
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {motorista.nome}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/caminhoes/${c.id}/editar`) }}
                  title="Editar caminhão"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex-shrink-0"
                  style={{ border: '1px solid #E0DDD8' }}
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => excluir(e, c)}
                  title="Excluir caminhão"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 flex-shrink-0"
                  style={{ border: '1px solid #FACACA' }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
