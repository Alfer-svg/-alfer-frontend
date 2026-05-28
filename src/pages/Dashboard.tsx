import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  Package, FileText, DollarSign, AlertTriangle,
  Layers, Clock, CheckCircle, XCircle, Map as MapIcon, ChevronRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import MapaEquipamentos from '../components/MapaEquipamentos'
import { salmoDoDia } from '../data/salmos'

interface DashData {
  frota: { total: number; locados: number; manutencao: number; livres: number }
  caminhoes: { total: number; emOperacao: number }
  contratos: { ativos: number; vencendoEm30: number }
  financeiro: { receitaMes: number; aReceber: { valor: number; count: number }; inadimplentes: number }
  operacoes: { hoje: number }
  cacambas: { locadas: number; cheias: number; total?: number }
}

interface Alerta {
  id: string
  tipo: string
  descricao: string
  urgencia: 'alta' | 'media'
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

export default function Dashboard() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [data, setData] = useState<DashData | null>(null)
  const [alertas, setAlertas] = useState<any>(null)
  const [equipamentosLoc, setEquipamentosLoc] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/dashboard/alertas'),
      api.get('/equipamentos', { params: { status: 'LOCADO' } }),
    ]).then(([dashRes, alertRes, equipRes]) => {
      setData(dashRes.data)
      setAlertas(alertRes.data)
      setEquipamentosLoc(equipRes.data.filter((e: any) => e.latitude != null && e.longitude != null))
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const kpis = data ? [
    {
      label: 'Receita do mês',
      value: fmt(data.financeiro.receitaMes),
      icon: DollarSign,
      color: '#27AE60',
      bg: '#EAF3DE',
      sub: `${fmt(data.financeiro.aReceber.valor)} a receber`,
    },
    {
      label: 'Contratos ativos',
      value: data.contratos.ativos,
      icon: FileText,
      color: '#FFAF06',
      bg: '#FEF3E2',
      sub: `${data.contratos.vencendoEm30} vencendo em 30 dias`,
    },
    {
      label: 'Equipamentos locados',
      value: `${data.frota.locados}/${data.frota.total}`,
      icon: Package,
      color: '#2D80D1',
      bg: '#E3EEFA',
      sub: `${data.frota.manutencao} em manutenção`,
    },
    {
      label: 'Caçambas ativas',
      value: data.cacambas.locadas,
      icon: Layers,
      color: '#9B59B6',
      bg: '#F0E6F6',
      sub: `${data.cacambas.cheias} para desmobilizar`,
    },
  ] : []

  // Mock fluxo mensal para gráfico
  const fluxo = [
    { mes: 'Jan', receita: 82000, despesas: 31000 },
    { mes: 'Fev', receita: 91000, despesas: 34000 },
    { mes: 'Mar', receita: 87000, despesas: 29000 },
    { mes: 'Abr', receita: 95000, despesas: 38000 },
    { mes: 'Mai', receita: data?.financeiro.receitaMes || 0, despesas: 35000 },
  ]

  const totalAlertas = alertas
    ? (alertas.contratosUrgentes?.length || 0) + (alertas.inadimplentes?.length || 0) + (alertas.cacambasChecas?.length || 0) + (alertas.faturasNaoConfirmadas?.length || 0)
    : 0

  const salmo = salmoDoDia()

  return (
    <div className="p-8 animate-fade-in">
      {/* Salmo do dia — discreto no topo */}
      <div className="text-center mb-6 -mt-2">
        <p className="text-sm text-gray-600 italic leading-relaxed">
          “{salmo.texto}”
          <span className="ml-2 text-gray-400 not-italic font-medium">— {salmo.ref}</span>
        </p>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          {saudacao}, {usuario?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl p-5 animate-fade-in"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{kpi.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
            </div>
            <div className="font-display text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
            <div className="text-gray-400 text-xs">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfico */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-gray-900">Fluxo de caixa</h2>
              <p className="text-gray-400 text-xs">Receitas e despesas — 2026</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#FFAF06' }} />Receita</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block bg-gray-200" />Despesas</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fluxo} barGap={4}>
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#999' }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => fmt(v)}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
              />
              <Bar dataKey="receita" fill="#FFAF06" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesas" fill="#E0DDD8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status frota */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Status da frota</h2>
          {data && (
            <div className="space-y-4">
              {[
                { label: 'Equipamentos locados', value: data.frota.locados, total: data.frota.total, color: '#FFAF06' },
                { label: 'Caminhões em operação', value: data.caminhoes.emOperacao, total: data.caminhoes.total, color: '#2D80D1' },
                { label: 'Caçambas locadas', value: data.cacambas.locadas, total: data.cacambas.total ?? 0, color: '#9B59B6' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-semibold text-gray-900">{item.value}/{item.total}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min((item.value / item.total) * 100, 100)}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-gray-600">{data?.operacoes.hoje || 0} operações agendadas hoje</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa dos equipamentos locados */}
      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5" style={{ color: '#FFAF06' }} />
            <h2 className="font-semibold text-gray-900">Equipamentos locados — mapa</h2>
            <span className="text-xs text-gray-400">({equipamentosLoc.length} com localização)</span>
          </div>
          <button
            onClick={() => navigate('/mapa')}
            className="flex items-center gap-1 text-xs font-medium hover:opacity-80"
            style={{ color: '#FFAF06' }}
          >
            Ver mapa completo <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {equipamentosLoc.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <MapIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhum equipamento locado com coordenadas cadastradas.</p>
            <p className="text-xs mt-1">
              Edite um equipamento e use o botão "Coords" no campo de localização.
            </p>
          </div>
        ) : (
          <MapaEquipamentos equipamentos={equipamentosLoc} height="320px" iconSize={36} />
        )}
      </div>

      {/* Alertas */}
      {alertas && totalAlertas > 0 && (
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Alertas ({totalAlertas})</h2>
          </div>
          <div className="space-y-3">
            {alertas.contratosUrgentes?.slice(0, 3).map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FEF3E2' }}>
                <XCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{c.cliente?.razaoSocial}</span>
                  <span className="text-xs text-gray-500 ml-2">Contrato {c.numero} vence em breve</span>
                </div>
              </div>
            ))}
            {alertas.inadimplentes?.slice(0, 3).map((l: any) => (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FDEEEE' }}>
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{l.cliente?.razaoSocial}</span>
                  <span className="text-xs text-gray-500 ml-2">Inadimplente — {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.valor)}</span>
                </div>
              </div>
            ))}
            {alertas.cacambasChecas?.slice(0, 2).map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F0E6F6' }}>
                <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{c.cacamba?.codigo}</span>
                  <span className="text-xs text-gray-500 ml-2">Caçamba cheia — aguardando coleta</span>
                </div>
              </div>
            ))}
            {alertas.faturasNaoConfirmadas?.slice(0, 4).map((l: any) => {
              const horas = Math.floor((Date.now() - new Date(l.emailEnviadoEm).getTime()) / 3_600_000)
              return (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FFF8E6' }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#B07900' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{l.cliente?.razaoSocial || 'Cliente'}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      Fatura {l.numeroFatura ? `NF ${l.numeroFatura}` : ''} enviada há {horas}h sem confirmação
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {alertas && totalAlertas === 0 && (
        <div className="bg-white rounded-2xl p-6 flex items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-gray-600 text-sm">Nenhum alerta no momento. Tudo em ordem!</span>
        </div>
      )}
    </div>
  )
}
