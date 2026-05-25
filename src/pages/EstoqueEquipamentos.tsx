import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Boxes, Loader2, AlertCircle, Search } from 'lucide-react'

type LinhaEstoque = {
  tipo: string
  modelo: string
  capacidade: string
  emEstoque: number
  locados: number
  manutencao: number
  total: number
}

const tipoLabel: Record<string, string> = {
  CONTAINER_SECO: 'Container Seco',
  CONTAINER_REEFER: 'Container Reefer',
  CACAMBA_ESTACIONARIA: 'Caçamba Estacionária',
  CAMINHAO_MUNCK: 'Caminhão Munck',
  CAMINHAO_POLIGUINDASTE: 'Caminhão Poliguindaste',
  CAMINHAO_CAVALO_MECANICO: 'Caminhão Cavalo Mecânico',
}

const iconePorTipo: Record<string, string> = {
  CONTAINER_SECO: 'container.png',
  CONTAINER_REEFER: 'container_reefer.png',
  CACAMBA_ESTACIONARIA: 'cacamba.png',
  CAMINHAO_MUNCK: 'munck.png',
  CAMINHAO_POLIGUINDASTE: 'poliguindaste.png',
  CAMINHAO_CAVALO_MECANICO: 'cavalo_mecanico.png',
}

export default function EstoqueEquipamentos() {
  const navigate = useNavigate()
  const [linhas, setLinhas] = useState<LinhaEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')

  useEffect(() => {
    setLoading(true); setErro('')
    api.get('/equipamentos/estoque')
      .then((r) => setLinhas(r.data))
      .catch((e) => setErro(e?.response?.data?.message || 'Erro ao carregar estoque'))
      .finally(() => setLoading(false))
  }, [])

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return linhas.filter((l) => {
      if (filtroTipo && l.tipo !== filtroTipo) return false
      if (!q) return true
      return l.modelo.toLowerCase().includes(q) || l.capacidade.toLowerCase().includes(q) || (tipoLabel[l.tipo] || '').toLowerCase().includes(q)
    })
  }, [linhas, busca, filtroTipo])

  // Totais agregados (do filtro atual)
  const totalEstoque = filtradas.reduce((s, l) => s + l.emEstoque, 0)
  const totalLocados = filtradas.reduce((s, l) => s + l.locados, 0)
  const totalManut   = filtradas.reduce((s, l) => s + l.manutencao, 0)
  const totalGeral   = filtradas.reduce((s, l) => s + l.total, 0)
  const percLocados  = totalGeral > 0 ? Math.round((totalLocados / totalGeral) * 100) : 0

  const tiposDistintos = Array.from(new Set(linhas.map((l) => l.tipo)))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Boxes className="w-6 h-6" style={{ color: '#FFAF06' }} /> Estoque de equipamentos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Resumo por modelo: quantos disponíveis, locados e em manutenção.</p>
        </div>
        <button
          onClick={() => navigate('/equipamentos/novo')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow"
          style={{ background: '#FFAF06' }}
        >
          + Cadastrar equipamento
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card label="Em estoque" valor={totalEstoque} cor="#16A34A" subtitulo="disponível pra locar" />
        <Card label="Locados" valor={totalLocados} cor="#1A5276" subtitulo={`${percLocados}% da frota`} />
        <Card label="Em manutenção" valor={totalManut} cor="#92400E" subtitulo="fora de operação" />
        <Card label="Total ativo" valor={totalGeral} cor="#1A1C1E" subtitulo={`${filtradas.length} modelo(s)`} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por modelo, capacidade ou tipo..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FAFAFA', border: '1.5px solid #E0DDD8' }}
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: '#FAFAFA', border: '1.5px solid #E0DDD8' }}
        >
          <option value="">Todos os tipos</option>
          {tiposDistintos.map((t) => (
            <option key={t} value={t}>{tipoLabel[t] || t}</option>
          ))}
        </select>
      </div>

      {erro && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">{erro}</span>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E0DDD8' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#FFAF06' }} />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            {linhas.length === 0 ? 'Nenhum equipamento cadastrado.' : 'Nada encontrado pra esse filtro.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider" style={{ background: '#FAFAF8', color: '#7A7A7A' }}>
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Tipo</th>
                <th className="text-left px-5 py-3 font-semibold">Modelo</th>
                <th className="text-left px-5 py-3 font-semibold">Capacidade</th>
                <th className="text-right px-5 py-3 font-semibold">Em estoque</th>
                <th className="text-right px-5 py-3 font-semibold">Locados</th>
                <th className="text-right px-5 py-3 font-semibold">Manutenção</th>
                <th className="text-right px-5 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((l, i) => {
                const icone = iconePorTipo[l.tipo]
                return (
                  <tr key={i} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: '#F1EFE8' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {icone && <img src={`/icones/${icone}`} alt="" className="w-7 h-7 object-contain" />}
                        <span className="text-xs text-gray-600">{tipoLabel[l.tipo] || l.tipo}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{l.modelo}</td>
                    <td className="px-5 py-3 text-gray-600">{l.capacidade}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#EAF3DE', color: '#27500A' }}>
                        {l.emEstoque}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#E3EEFA', color: '#1A5276' }}>
                        {l.locados}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {l.manutencao > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#FEF3E2', color: '#633806' }}>
                          {l.manutencao}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">{l.total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Card({ label, valor, cor, subtitulo }: { label: string; valor: number; cor: string; subtitulo?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #E0DDD8' }}>
      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A7A7A' }}>{label}</div>
      <div className="font-display text-3xl font-extrabold mt-1" style={{ color: cor }}>{valor}</div>
      {subtitulo && <div className="text-xs mt-0.5" style={{ color: '#9A9A9A' }}>{subtitulo}</div>}
    </div>
  )
}
