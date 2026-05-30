import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  Navigation, Plus, ChevronRight, TrendingUp, TrendingDown, MapPin,
  DollarSign, Gauge, Percent, Truck, Settings, ArrowRight,
} from 'lucide-react'
import { fmtDate } from '../utils/data'

const statusInfo: Record<string, { bg: string; text: string; label: string }> = {
  AGENDADA: { bg: '#FEF3E2', text: '#633806', label: 'Agendada' },
  EM_VIAGEM: { bg: '#FFF3D6', text: '#A77400', label: 'Em viagem' },
  CONCLUIDA: { bg: '#EAF3DE', text: '#27500A', label: 'Concluída' },
  CANCELADA: { bg: '#FDEEEE', text: '#8B0000', label: 'Cancelada' },
}

const fmt = (v: any) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
const fmtKm = (v: any) => `${Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} km`
const mesAtual = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function FreteSpot() {
  const navigate = useNavigate()
  const [viagens, setViagens] = useState<any[]>([])
  const [dash, setDash] = useState<any>(null)
  const [mes, setMes] = useState(mesAtual())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/frete-spot', { params: { mes } }),
      api.get('/frete-spot/dashboard', { params: { mes } }),
    ])
      .then(([v, d]) => {
        setViagens(v.data)
        setDash(d.data)
      })
      .finally(() => setLoading(false))
  }, [mes])

  return (
    <div className="p-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Navigation className="w-6 h-6" style={{ color: '#FFAF06' }} /> Frete Spot
          </h1>
          <p className="text-gray-500 text-sm mt-1">{viagens.length} viagem(ns) no mês</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="month"
            value={mes}
            max={mesAtual()}
            onChange={(e) => setMes(e.target.value)}
            className="px-3 py-2.5 bg-white rounded-xl text-sm outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          />
          <button
            onClick={() => navigate('/frete-spot/config')}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white"
            style={{ border: '1px solid #E0DDD8' }}
          >
            <Settings className="w-4 h-4" /> Custo fixo
          </button>
          <button
            onClick={() => navigate('/frete-spot/nova')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-900"
            style={{ background: '#FFAF06' }}
          >
            <Plus className="w-4 h-4" /> Nova viagem
          </button>
        </div>
      </div>

      {/* INDICADORES */}
      {dash && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <Indicador icon={Truck} label="Viagens" valor={String(dash.viagens)} />
          <Indicador icon={DollarSign} label="Receita" valor={fmt(dash.receita)} />
          <Indicador
            icon={dash.lucro >= 0 ? TrendingUp : TrendingDown}
            label="Lucro"
            valor={fmt(dash.lucro)}
            cor={dash.lucro >= 0 ? '#27AE60' : '#E74C3C'}
          />
          <Indicador icon={Gauge} label="R$/km (carga)" valor={dash.receitaPorKm != null ? fmt(dash.receitaPorKm) : '—'} />
          <Indicador
            icon={Percent}
            label="Margem"
            valor={dash.margemPct != null ? `${dash.margemPct}%` : '—'}
            cor={dash.margemPct != null && dash.margemPct < 0 ? '#E74C3C' : undefined}
          />
          <Indicador
            icon={MapPin}
            label="Km vazio"
            valor={dash.pctVazio != null ? `${dash.pctVazio}%` : '—'}
            sub={`${fmtKm(dash.kmVazio)} de ${fmtKm(dash.kmCarga + dash.kmVazio)}`}
          />
        </div>
      )}

      {/* LISTA */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viagens.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Navigation className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma viagem neste mês</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {viagens.map((v) => {
            const st = statusInfo[v.status] || statusInfo.AGENDADA
            const r = v.resultado || {}
            const lucroPos = (r.lucro ?? 0) >= 0
            return (
              <div
                key={v.id}
                onClick={() => navigate(`/frete-spot/${v.id}`)}
                className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all animate-fade-in"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
                  <Navigation className="w-5 h-5" style={{ color: '#FFAF06' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{v.numero}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.text }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
                    <span className="font-medium">{v.origemCidade || '—'}{v.origemUF ? `/${v.origemUF}` : ''}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium">{v.destinoCidade || '—'}{v.destinoUF ? `/${v.destinoUF}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap mt-0.5">
                    {v.embarcador && <span>{v.embarcador}</span>}
                    {v.distanciaKm != null && <span>{fmtKm(v.distanciaKm)}</span>}
                    <span>Coleta: {fmtDate(v.dataColeta)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-gray-900 text-sm">{fmt(v.valorFrete)}</div>
                  <div className="text-xs" style={{ color: lucroPos ? '#27AE60' : '#E74C3C' }}>
                    Lucro {fmt(r.lucro)}
                  </div>
                  {r.receitaPorKm != null && (
                    <div className="text-[11px] text-gray-400">{fmt(r.receitaPorKm)}/km</div>
                  )}
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

function Indicador({ icon: Icon, label, valor, sub, cor }: any) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="font-display text-lg font-bold" style={{ color: cor || '#1F2937' }}>{valor}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}
