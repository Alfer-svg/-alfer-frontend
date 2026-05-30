import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import {
  ChevronLeft, Save, Trash2, Loader2, AlertCircle, Navigation, MapPin,
  DollarSign, Fuel, Calculator, TrendingUp, TrendingDown,
} from 'lucide-react'

const FONTES = [
  { value: 'BOLSA_CARGAS', label: 'Bolsa de cargas' },
  { value: 'INDICACAO', label: 'Indicação' },
  { value: 'EMBARCADOR_DIRETO', label: 'Embarcador direto' },
  { value: 'AGENCIADOR', label: 'Agenciador' },
  { value: 'OUTROS', label: 'Outros' },
]
const STATUS = [
  { value: 'AGENDADA', label: 'Agendada' },
  { value: 'EM_VIAGEM', label: 'Em viagem' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

const fmt = (v: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
const num = (v: any) => { const n = Number(v); return isNaN(n) ? 0 : n }
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// Espelha o cálculo do backend pra feedback ao vivo enquanto edita
function calcResultado(v: any) {
  const valorFrete = num(v.valorFrete)
  const combustivel = num(v.combustivelTotal) || round2(num(v.combustivelLitros) * num(v.combustivelPrecoLitro))
  const pedagioCusto = v.pedagioPorConta === 'EMBARCADOR' ? 0 : num(v.valorPedagio)
  const comissao = num(v.comissaoValor) || round2((num(v.comissaoPercent) / 100) * valorFrete)
  const despesas = num(v.despesasViagem)
  const custoMotorista = num(v.custoMotorista)
  const outros = num(v.outrosCustos)
  const custosVariaveis = round2(combustivel + pedagioCusto + comissao + despesas + custoMotorista + outros)
  const kmCarga = num(v.distanciaKm)
  const kmVazio = num(v.kmVazio)
  const kmTotal = round2(kmCarga + kmVazio)
  const custoFixoRateado = round2(num(v.custoFixoPorKm) * kmTotal)
  const custoTotal = round2(custosVariaveis + custoFixoRateado)
  const lucro = round2(valorFrete - custoTotal)
  const adiantamento = num(v.adiantamento)
  const saldo = round2(valorFrete - adiantamento)
  const recebido = round2((v.adiantamentoRecebido ? adiantamento : 0) + (v.saldoRecebido ? saldo : 0))
  return {
    combustivel, pedagioCusto, comissao, custosVariaveis, custoFixoRateado, custoTotal,
    kmCarga, kmTotal, receita: valorFrete, lucro, saldo, recebido,
    aReceber: round2(valorFrete - recebido),
    receitaPorKm: kmCarga > 0 ? round2(valorFrete / kmCarga) : null,
    lucroPorKm: kmCarga > 0 ? round2(lucro / kmCarga) : null,
    custoPorKm: kmTotal > 0 ? round2(custoTotal / kmTotal) : null,
    margemPct: valorFrete > 0 ? round2((lucro / valorFrete) * 100) : null,
  }
}

const isoLocal = (d?: string) => (d ? String(d).slice(0, 10) : '')

export default function FreteSpotDetalhe() {
  const { id } = useParams<{ id: string }>()
  const isNova = id === 'nova'
  const navigate = useNavigate()
  const [v, setV] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (isNova) {
      api.post('/frete-spot', {})
        .then((r) => {
          setV(r.data)
          navigate(`/frete-spot/${r.data.id}`, { replace: true })
        })
        .catch((e) => setErro(e.response?.data?.message || 'Erro ao criar viagem'))
        .finally(() => setLoading(false))
      return
    }
    api.get(`/frete-spot/${id}`)
      .then((r) => setV(r.data))
      .catch((e) => setErro(e.response?.data?.message || 'Erro ao carregar viagem'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (campo: string, valor: any) => setV((o: any) => ({ ...o, [campo]: valor }))

  const salvar = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!v) return
    setSalvando(true); setErro('')
    try {
      const r = await api.put(`/frete-spot/${v.id}`, v)
      setV(r.data)
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async () => {
    if (!confirm('Excluir esta viagem? Não dá pra desfazer.')) return
    try {
      await api.delete(`/frete-spot/${v.id}`)
      navigate('/frete-spot')
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao excluir')
    }
  }

  if (loading || !v) {
    return (
      <div className="flex items-center justify-center h-screen">
        {erro ? (
          <div className="p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE' }}>
            <AlertCircle className="w-4 h-4" /> {erro}
          </div>
        ) : (
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    )
  }

  const r = calcResultado(v)
  const lucroPos = r.lucro >= 0

  return (
    <div className="p-6 md:p-8 max-w-4xl pb-28 animate-fade-in">
      <button onClick={() => navigate('/frete-spot')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all">
        <ChevronLeft className="w-4 h-4" /> Voltar para viagens
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
          <Navigation className="w-6 h-6" style={{ color: '#FFAF06' }} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">{v.numero}</h1>
          <p className="text-gray-500 text-sm">Viagem de frete spot</p>
        </div>
      </div>

      {erro && (
        <div className="mb-4 p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4" /> {erro}
        </div>
      )}

      <form onSubmit={salvar} className="space-y-6">
        {/* 1. CADASTRO */}
        <Secao titulo="1. Cadastro da viagem" icon={MapPin}>
          <Campo label="Status">
            <Select value={v.status} onChange={(x: string) => set('status', x)} options={STATUS} />
          </Campo>
          <Grid2>
            <Campo label="Data de coleta"><Input type="date" value={isoLocal(v.dataColeta)} onChange={(x: string) => set('dataColeta', x)} /></Campo>
            <Campo label="Data de entrega"><Input type="date" value={isoLocal(v.dataEntrega)} onChange={(x: string) => set('dataEntrega', x)} /></Campo>
          </Grid2>
          <Grid2>
            <Campo label="Origem (cidade)"><Input value={v.origemCidade} onChange={(x: string) => set('origemCidade', x)} /></Campo>
            <Campo label="Origem (UF)"><Input value={v.origemUF} onChange={(x: string) => set('origemUF', x?.toUpperCase())} /></Campo>
          </Grid2>
          <Grid2>
            <Campo label="Destino (cidade)"><Input value={v.destinoCidade} onChange={(x: string) => set('destinoCidade', x)} /></Campo>
            <Campo label="Destino (UF)"><Input value={v.destinoUF} onChange={(x: string) => set('destinoUF', x?.toUpperCase())} /></Campo>
          </Grid2>
          <Campo label="Produto transportado"><Input value={v.produto} onChange={(x: string) => set('produto', x)} /></Campo>
          <Grid2>
            <Campo label="Peso (toneladas)"><Input type="number" step="0.001" value={v.pesoToneladas} onChange={(x: string) => set('pesoToneladas', x)} /></Campo>
            <Campo label="Volume (m³)"><Input type="number" step="0.01" value={v.volumeM3} onChange={(x: string) => set('volumeM3', x)} /></Campo>
          </Grid2>
          <Grid2>
            <Campo label="Origem do frete"><Select value={v.fonte || ''} onChange={(x: string) => set('fonte', x)} options={FONTES} placeholder="Selecione" /></Campo>
            <Campo label="Embarcador / contratante"><Input value={v.embarcador} onChange={(x: string) => set('embarcador', x)} /></Campo>
          </Grid2>
          <Grid2>
            <Campo label="Distância com carga (km)"><Input type="number" step="0.1" value={v.distanciaKm} onChange={(x: string) => set('distanciaKm', x)} /></Campo>
            <Campo label="Km vazio (deslocamento)"><Input type="number" step="0.1" value={v.kmVazio} onChange={(x: string) => set('kmVazio', x)} /></Campo>
          </Grid2>
          <Grid2>
            <Campo label="Motorista"><Input value={v.motorista} onChange={(x: string) => set('motorista', x)} /></Campo>
            <Campo label="Placa cavalo / carreta">
              <div className="flex gap-2">
                <Input value={v.placaCavalo} onChange={(x: string) => set('placaCavalo', x?.toUpperCase())} />
                <Input value={v.placaCarreta} onChange={(x: string) => set('placaCarreta', x?.toUpperCase())} />
              </div>
            </Campo>
          </Grid2>
        </Secao>

        {/* 2. RECEITA */}
        <Secao titulo="2. Receita" icon={DollarSign}>
          <Grid2>
            <Campo label="Valor do frete (R$)"><Input type="number" step="0.01" value={v.valorFrete} onChange={(x: string) => set('valorFrete', x)} /></Campo>
            <Campo label="Forma de pagamento"><Input value={v.formaPagamento} onChange={(x: string) => set('formaPagamento', x)} /></Campo>
          </Grid2>
          <Grid2>
            <Campo label="Pedágio por conta de">
              <Select value={v.pedagioPorConta} onChange={(x: string) => set('pedagioPorConta', x)} options={[
                { value: 'TRANSPORTADOR', label: 'Transportador (Alfer) — é custo' },
                { value: 'EMBARCADOR', label: 'Embarcador — não é custo' },
              ]} />
            </Campo>
            <Campo label="Valor do pedágio (R$)"><Input type="number" step="0.01" value={v.valorPedagio} onChange={(x: string) => set('valorPedagio', x)} /></Campo>
          </Grid2>
          <Grid2>
            <Campo label="Adiantamento (R$)"><Input type="number" step="0.01" value={v.adiantamento} onChange={(x: string) => set('adiantamento', x)} /></Campo>
            <Campo label="Saldo a receber (calculado)">
              <div className="px-3 py-3 rounded-lg text-sm font-semibold text-gray-700" style={{ background: '#F8F6F1', border: '1px solid #E0DDD8' }}>{fmt(r.saldo)}</div>
            </Campo>
          </Grid2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Check label="Adiantamento recebido" checked={!!v.adiantamentoRecebido} onChange={(c: boolean) => set('adiantamentoRecebido', c)} />
            <Check label="Saldo recebido" checked={!!v.saldoRecebido} onChange={(c: boolean) => set('saldoRecebido', c)} />
          </div>
        </Secao>

        {/* 3. CUSTOS */}
        <Secao titulo="3. Custos da viagem" icon={Fuel}>
          <Grid3>
            <Campo label="Combustível — litros"><Input type="number" step="0.01" value={v.combustivelLitros} onChange={(x: string) => set('combustivelLitros', x)} /></Campo>
            <Campo label="Preço/litro (R$)"><Input type="number" step="0.001" value={v.combustivelPrecoLitro} onChange={(x: string) => set('combustivelPrecoLitro', x)} /></Campo>
            <Campo label="Total combustível (R$)"><Input type="number" step="0.01" value={v.combustivelTotal} onChange={(x: string) => set('combustivelTotal', x)} placeholder={String(r.combustivel || '')} /></Campo>
          </Grid3>
          <Grid2>
            <Campo label="Comissão / agenciamento (%)"><Input type="number" step="0.01" value={v.comissaoPercent} onChange={(x: string) => set('comissaoPercent', x)} /></Campo>
            <Campo label="Comissão (R$)"><Input type="number" step="0.01" value={v.comissaoValor} onChange={(x: string) => set('comissaoValor', x)} placeholder={String(r.comissao || '')} /></Campo>
          </Grid2>
          <Campo label="Despesas de viagem (alimentação, pernoite, lavagem, manutenção de estrada)">
            <Input type="number" step="0.01" value={v.despesasViagem} onChange={(x: string) => set('despesasViagem', x)} />
          </Campo>
          <Campo label="Descrição das despesas"><Input value={v.despesasDescricao} onChange={(x: string) => set('despesasDescricao', x)} /></Campo>
          <Grid2>
            <Campo label="Custo do motorista (R$ — 0 se for você)"><Input type="number" step="0.01" value={v.custoMotorista} onChange={(x: string) => set('custoMotorista', x)} /></Campo>
            <Campo label="Outros custos (R$)"><Input type="number" step="0.01" value={v.outrosCustos} onChange={(x: string) => set('outrosCustos', x)} /></Campo>
          </Grid2>
          <Campo label="Descrição de outros custos"><Input value={v.outrosCustosDescricao} onChange={(x: string) => set('outrosCustosDescricao', x)} /></Campo>
          <Campo label="Custo fixo por km (R$ — herdado da config, editável)">
            <Input type="number" step="0.0001" value={v.custoFixoPorKm} onChange={(x: string) => set('custoFixoPorKm', x)} />
            <p className="text-[11px] text-gray-400 mt-1">Multiplica pelos km totais ({r.kmTotal} km) → {fmt(r.custoFixoRateado)} rateado nesta viagem.</p>
          </Campo>
          <Campo label="Observações"><Input value={v.observacoes} onChange={(x: string) => set('observacoes', x)} /></Campo>
        </Secao>

        {/* 4. RESULTADO */}
        <div className="rounded-2xl p-5" style={{ background: '#FEF3E2', border: '1px solid #FFAF06' }}>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
            <Calculator className="w-4 h-4" style={{ color: '#FFAF06' }} /> Resultado da viagem
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <Res label="Receita" valor={fmt(r.receita)} />
            <Res label="Custos variáveis" valor={fmt(r.custosVariaveis)} />
            <Res label="Custo fixo rateado" valor={fmt(r.custoFixoRateado)} />
            <Res label="Custo total" valor={fmt(r.custoTotal)} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Res label="Lucro" valor={fmt(r.lucro)} cor={lucroPos ? '#27AE60' : '#E74C3C'} icon={lucroPos ? TrendingUp : TrendingDown} destaque />
            <Res label="R$/km (carga)" valor={r.receitaPorKm != null ? fmt(r.receitaPorKm) : '—'} />
            <Res label="Lucro/km" valor={r.lucroPorKm != null ? fmt(r.lucroPorKm) : '—'} cor={lucroPos ? '#27AE60' : '#E74C3C'} />
            <Res label="Margem" valor={r.margemPct != null ? `${r.margemPct}%` : '—'} cor={r.margemPct != null && r.margemPct < 0 ? '#E74C3C' : '#1F2937'} />
          </div>
          <div className="text-xs text-gray-500 mt-3">
            A receber: <span className="font-semibold text-gray-700">{fmt(r.aReceber)}</span> · Recebido: {fmt(r.recebido)}
          </div>
        </div>
      </form>

      {/* BARRA FIXA */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-60 bg-white border-t p-3 flex gap-2 z-30" style={{ borderColor: '#E0DDD8' }}>
        <button onClick={excluir} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50" style={{ border: '1px solid #FACACA' }}>
          <Trash2 className="w-4 h-4" /> Excluir
        </button>
        <button onClick={() => salvar()} disabled={salvando} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-900 disabled:opacity-50" style={{ background: '#FFAF06' }}>
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar viagem
        </button>
      </div>
    </div>
  )
}

// ─── Subcomponentes ────────────────────────────────────────────────────────
function Secao({ titulo, icon: Icon, children }: any) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
        {Icon && <Icon className="w-4 h-4" style={{ color: '#FFAF06' }} />}
        {titulo}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
function Campo({ label, children }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-700 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
function Grid2({ children }: any) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div> }
function Grid3({ children }: any) { return <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div> }
function Input({ value, onChange, type = 'text', step, placeholder }: any) {
  return (
    <input
      type={type}
      step={step}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-3 bg-white rounded-lg text-sm outline-none"
      style={{ border: '1px solid #E0DDD8' }}
    />
  )
}
function Select({ value, onChange, options, placeholder }: any) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-3 bg-white rounded-lg text-sm outline-none" style={{ border: '1px solid #E0DDD8' }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
function Check({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center gap-2 px-3 py-3 rounded-lg cursor-pointer text-sm" style={{ background: checked ? '#EAF3DE' : '#fff', border: `1px solid ${checked ? '#27AE60' : '#E0DDD8'}` }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="font-medium text-gray-700">{label}</span>
    </label>
  )
}
function Res({ label, valor, cor, icon: Icon, destaque }: any) {
  return (
    <div className="rounded-xl p-3 bg-white" style={{ border: destaque ? '1px solid #FFAF06' : '1px solid #F1EFE8' }}>
      <div className="text-[11px] text-gray-400 mb-1 flex items-center gap-1">{Icon && <Icon className="w-3 h-3" />}{label}</div>
      <div className="font-display font-bold text-base" style={{ color: cor || '#1F2937' }}>{valor}</div>
    </div>
  )
}
