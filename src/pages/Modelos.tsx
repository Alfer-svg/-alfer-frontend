import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Layers3, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'

const tipos = [
  { v: 'CONTAINER_SECO', l: 'Container Seco' },
  { v: 'CONTAINER_REEFER', l: 'Container Reefer' },
  { v: 'CACAMBA_ESTACIONARIA', l: 'Caçamba Estacionária' },
  { v: 'CAMINHAO_MUNCK', l: 'Caminhão Munck' },
  { v: 'CAMINHAO_POLIGUINDASTE', l: 'Caminhão Poliguindaste' },
  { v: 'CAMINHAO_CAVALO_MECANICO', l: 'Caminhão Cavalo Mecânico' },
]

const tipoLabel = (v: string) => tipos.find((t) => t.v === v)?.l || v
const unidade = (t: string) => (t === 'HORA' ? '/h' : t === 'DIARIA' ? '/dia' : t === 'SEMANAL' ? '/sem' : '/mês')

export default function Modelos() {
  const navigate = useNavigate()
  const [modelos, setModelos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [excluindoId, setExcluindoId] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/modelos', { params: filtroTipo ? { tipo: filtroTipo } : {} })
      .then((r) => setModelos(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroTipo])

  const excluir = async (m: any) => {
    if (!confirm(`Excluir o modelo "${m.nome}"?`)) return
    setErroAcao('')
    setExcluindoId(m.id)
    try {
      await api.delete(`/modelos/${m.id}`)
      load()
    } catch (err: any) {
      setErroAcao(err.response?.data?.message || 'Erro ao excluir modelo.')
    } finally {
      setExcluindoId('')
    }
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Modelos de equipamento</h1>
          <p className="text-gray-500 text-sm mt-1">
            {modelos.length} modelo(s) cadastrado(s). Aparecem como opção ao cadastrar um equipamento.
          </p>
        </div>
        <button
          onClick={() => navigate('/modelos/novo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" />
          Novo modelo
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos os tipos</option>
          {tipos.map((t) => (<option key={t.v} value={t.v}>{t.l}</option>))}
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
      ) : modelos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Layers3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum modelo cadastrado</p>
          <p className="text-xs mt-1">Cadastre modelos pra reutilizar capacidade, preços, descrição e foto ao criar equipamentos.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {modelos.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl p-5 flex items-center gap-4 animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {m.fotoUrl ? (
                <img src={m.fotoUrl} alt={m.nome} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" style={{ background: '#FEF3E2' }} />
              ) : (
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
                  <Layers3 className="w-5 h-5" style={{ color: '#FFAF06' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900">{m.nome}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#FEF3E2', color: '#633806' }}>
                    {tipoLabel(m.tipo)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                  {m.capacidade && <span>{m.capacidade}</span>}
                  {Array.isArray(m.precos) && m.precos.length > 0
                    ? m.precos.map((p: any) => (
                        <span key={p.id || p.tipoLocacao} className="font-medium text-gray-700">
                          R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{unidade(p.tipoLocacao)}
                        </span>
                      ))
                    : m.valorLocacao != null && (
                        <span className="font-medium text-gray-700">
                          R$ {Number(m.valorLocacao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{unidade(m.tipoLocacao)}
                        </span>
                      )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/modelos/${m.id}/editar`)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                  style={{ border: '1px solid #E0DDD8' }}
                >
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button
                  onClick={() => excluir(m)}
                  disabled={excluindoId === m.id}
                  title="Excluir modelo"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  style={{ border: '1px solid #FACACA' }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
