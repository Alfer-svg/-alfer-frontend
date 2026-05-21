import { useState, useEffect } from 'react'
import api from '../services/api'
import { Search, Plus, Building2, Phone, Mail, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  ATIVO: { bg: '#EAF3DE', text: '#27500A', label: 'Ativo' },
  ALERTA: { bg: '#FEF3E2', text: '#633806', label: 'Alerta' },
  INADIMPLENTE: { bg: '#FDEEEE', text: '#8B0000', label: 'Inadimplente' },
  INATIVO: { bg: '#F1EFE8', text: '#888', label: 'Inativo' },
}

const segLabel: Record<string, string> = {
  CONSTRUTORA: 'Construtora',
  INDUSTRIA_REFINARIA: 'Indústria / Refinaria',
  PORTO_LOGISTICA: 'Porto / Logística',
  PREFEITURA_GOVERNO: 'Prefeitura / Governo',
  OUTROS: 'Outros',
}

export default function Clientes() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    api.get('/clientes').then((r) => setClientes(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = clientes.filter((c) =>
    c.razaoSocial.toLowerCase().includes(busca.toLowerCase()) ||
    c.cnpj.includes(busca)
  )

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{clientes.length} clientes cadastrados</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium transition-all hover:opacity-90"
          onClick={() => navigate('/clientes/novo')}
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" />
          Novo cliente
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por razão social ou CNPJ..."
          className="w-full pl-11 pr-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {filtered.map((c) => {
            const status = statusColor[c.status] || statusColor.ATIVO
            const contato = c.contatos?.[0]
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all animate-fade-in"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-bold text-white text-lg" style={{ background: '#FFAF06' }}>
                  {c.razaoSocial.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-900 truncate">{c.razaoSocial}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0" style={{ background: status.bg, color: status.text }}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{c.cnpj}</span>
                    <span className="hidden sm:block">{segLabel[c.segmento] || c.segmento}</span>
                    {contato?.telefone && (
                      <span className="hidden md:flex items-center gap-1">
                        <Phone className="w-3 h-3" />{contato.telefone}
                      </span>
                    )}
                    {contato?.email && (
                      <span className="hidden lg:flex items-center gap-1">
                        <Mail className="w-3 h-3" />{contato.email}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
