import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Save, Settings, Gauge } from 'lucide-react'

const fmt = (v: any) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
const fmt4 = (v: any) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(Number(v || 0))
const num = (v: any) => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const COMPONENTES = [
  { key: 'financiamento', label: 'Financiamento (cavalo/carreta)', hint: 'Parcela mensal do financiamento' },
  { key: 'ipvaLicenciamento', label: 'IPVA + Licenciamento', hint: 'Valor anual ÷ 12' },
  { key: 'seguro', label: 'Seguro', hint: 'Prêmio mensal' },
  { key: 'manutencaoProgramada', label: 'Manutenção programada', hint: 'Pneus, troca de óleo, revisões' },
  { key: 'outrosFixos', label: 'Outros custos fixos', hint: 'Rastreador, contador, etc.' },
]

export default function FreteSpotConfig() {
  const navigate = useNavigate()
  const [cfg, setCfg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api.get('/frete-spot/config')
      .then((r) => setCfg(r.data))
      .finally(() => setLoading(false))
  }, [])

  const set = (k: string, v: any) => setCfg((c: any) => ({ ...c, [k]: v }))

  const custoFixoMensal = COMPONENTES.reduce((s, c) => s + num(cfg?.[c.key]), 0)
  const km = num(cfg?.kmPrevistoMes)
  const custoFixoPorKm = km > 0 ? custoFixoMensal / km : 0

  const salvar = async () => {
    setSalvando(true)
    try {
      const payload = {
        financiamento: num(cfg.financiamento),
        ipvaLicenciamento: num(cfg.ipvaLicenciamento),
        seguro: num(cfg.seguro),
        manutencaoProgramada: num(cfg.manutencaoProgramada),
        outrosFixos: num(cfg.outrosFixos),
        kmPrevistoMes: num(cfg.kmPrevistoMes),
      }
      const r = await api.put('/frete-spot/config', payload)
      setCfg(r.data)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 animate-fade-in max-w-3xl">
      {/* HEADER */}
      <button
        onClick={() => navigate('/frete-spot')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <div className="flex items-center gap-2 mb-1">
        <Settings className="w-6 h-6" style={{ color: '#FFAF06' }} />
        <h1 className="font-display text-2xl font-bold text-gray-900">Custo fixo mensal</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Componentes do custo fixo do conjunto. O sistema soma tudo e divide pelos km previstos no mês
        para achar o <strong>custo fixo por km</strong> — usado no rateio de cada viagem.
      </p>

      {/* COMPONENTES */}
      <div className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold text-gray-900 text-sm mb-4">Componentes (R$/mês)</h2>
        <div className="space-y-4">
          {COMPONENTES.map((c) => (
            <div key={c.key} className="grid grid-cols-[1fr,160px] gap-4 items-center">
              <div>
                <div className="text-sm font-medium text-gray-800">{c.label}</div>
                <div className="text-xs text-gray-400">{c.hint}</div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cfg?.[c.key] ?? ''}
                  onChange={(e) => set(c.key, e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl text-sm outline-none text-right"
                  style={{ border: '1px solid #E0DDD8' }}
                  placeholder="0,00"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KM PREVISTO */}
      <div className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="grid grid-cols-[1fr,160px] gap-4 items-center">
          <div>
            <div className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-gray-400" /> Km previstos no mês
            </div>
            <div className="text-xs text-gray-400">Quanto você pretende rodar — base do rateio</div>
          </div>
          <div className="relative">
            <input
              type="number"
              step="1"
              min="0"
              value={cfg?.kmPrevistoMes ?? ''}
              onChange={(e) => set('kmPrevistoMes', e.target.value)}
              className="w-full pl-3 pr-9 py-2.5 bg-white rounded-xl text-sm outline-none text-right"
              style={{ border: '1px solid #E0DDD8' }}
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">km</span>
          </div>
        </div>
      </div>

      {/* RESULTADO */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: '#FEF3E2', border: '1px solid #FFAF06' }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Custo fixo mensal</div>
            <div className="font-display text-2xl font-bold text-gray-900">{fmt(custoFixoMensal)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Custo fixo por km</div>
            <div className="font-display text-2xl font-bold" style={{ color: '#A77400' }}>
              {km > 0 ? `${fmt4(custoFixoPorKm)}/km` : '—'}
            </div>
            {km <= 0 && <div className="text-[11px] text-gray-400 mt-0.5">Informe os km previstos</div>}
          </div>
        </div>
      </div>

      {/* SALVAR */}
      <div className="flex justify-end">
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-900 disabled:opacity-60"
          style={{ background: '#FFAF06' }}
        >
          <Save className="w-4 h-4" /> {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
