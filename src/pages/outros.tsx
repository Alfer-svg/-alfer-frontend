// Financeiro
import { useState, useEffect } from 'react'
import api from '../services/api'
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export function Financeiro() {
  const [dash, setDash] = useState<any>(null)
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/financeiro/dashboard'),
      api.get('/financeiro/lancamentos'),
    ]).then(([d, l]) => {
      setDash(d.data)
      setLancamentos(l.data.slice(0, 15))
    }).finally(() => setLoading(false))
  }, [])

  const statusColor: Record<string, string> = {
    PAGO: '#27AE60', PENDENTE: '#FFAF06', FUTURO: '#2D80D1', VENCIDO: '#E74C3C', INADIMPLENTE: '#8B0000',
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-gray-500 text-sm mt-1">Receitas, despesas e fluxo de caixa</p>
      </div>

      {dash && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Receita do mês', value: fmt(dash.receita), icon: TrendingUp, color: '#27AE60', bg: '#EAF3DE' },
            { label: 'Despesas do mês', value: fmt(dash.despesas), icon: TrendingDown, color: '#E74C3C', bg: '#FDEEEE' },
            { label: 'Saldo', value: fmt(dash.saldo), icon: DollarSign, color: '#FFAF06', bg: '#FEF3E2' },
            { label: 'A receber', value: fmt(dash.aReceber?.valor || 0), icon: Clock, color: '#2D80D1', bg: '#E3EEFA' },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-xs uppercase tracking-wide">{k.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: k.bg }}>
                  <k.icon className="w-4 h-4" style={{ color: k.color }} />
                </div>
              </div>
              <div className="font-display text-xl font-bold text-gray-900">{k.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Lançamentos recentes</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {lancamentos.map((l) => (
            <div key={l.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ background: l.tipo === 'RECEITA' ? '#27AE60' : '#E74C3C' }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{l.descricao}</div>
                <div className="text-xs text-gray-400">{l.cliente?.razaoSocial || l.fornecedor || '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold" style={{ color: l.tipo === 'RECEITA' ? '#27AE60' : '#E74C3C' }}>
                  {l.tipo === 'RECEITA' ? '+' : '-'}{fmt(l.valor)}
                </div>
                <div className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: '#F1EFE8', color: statusColor[l.status] || '#888' }}>
                  {l.status}
                </div>
              </div>
            </div>
          ))}
          {lancamentos.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhum lançamento encontrado</div>
          )}
        </div>
      </div>
    </div>
  )
}

// Placeholder genérico para módulos em construção
function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>
      <div className="bg-white rounded-2xl p-16 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#FEF3E2' }}>
          <DollarSign className="w-8 h-8" style={{ color: '#FFAF06' }} />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Módulo em desenvolvimento</h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Este módulo estará disponível em breve. O backend já está pronto e conectado!
        </p>
      </div>
    </div>
  )
}

export function Equipamentos() { return <Placeholder title="Equipamentos" subtitle="Frota de guindastes, containers e caçambas" /> }
export function Caminhoes() { return <Placeholder title="Caminhões" subtitle="Munck, Poliguindaste e Cavalo Mecânico" /> }
export function Cacambas() { return <Placeholder title="Caçambas" subtitle="Locações, trocas e rastreabilidade ambiental" /> }
export function Agenda() { return <Placeholder title="Agenda" subtitle="Calendário de operações e logística" /> }
