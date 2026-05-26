import { useEffect, useState } from 'react'
import api from '../services/api'
import { BarChart3, TrendingUp, Users, Building2, AlertTriangle, Loader2, Grid3X3 } from 'lucide-react'
import { fmtDate } from '../utils/data'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Relatorios() {
  const [aba, setAba] = useState<'fluxo' | 'aging' | 'cliente' | 'emissor' | 'mensal_emissor'>('fluxo')
  const [ano, setAno] = useState(new Date().getFullYear())
  const [emissores, setEmissores] = useState<any[]>([])
  const [filtroEmissor, setFiltroEmissor] = useState('')

  useEffect(() => {
    api.get('/emissores', { params: { ativo: 'true' } })
      .then((r) => setEmissores((r.data || []).filter((e: any) => e.ativo)))
      .catch(() => {})
  }, [])

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7" style={{ color: '#FFAF06' }} />
            Relatórios
          </h1>
          <p className="text-gray-500 text-sm mt-1">Visão consolidada do financeiro</p>
        </div>
        <div className="flex gap-2">
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="px-3 py-2 bg-white rounded-xl text-sm outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          >
            {[0, 1, 2].map((off) => {
              const y = new Date().getFullYear() - off
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
          {emissores.length > 1 && aba !== 'emissor' && aba !== 'mensal_emissor' && (
            <select
              value={filtroEmissor}
              onChange={(e) => setFiltroEmissor(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl text-sm outline-none"
              style={{
                border: '1px solid #E0DDD8',
                ...(filtroEmissor && { background: '#FEF3E2', color: '#633806', fontWeight: 500 }),
              }}
            >
              <option value="">Todos os emissores</option>
              {emissores.map((em) => (
                <option key={em.id} value={em.id}>{em.nomeFantasia || em.razaoSocial}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-6 mt-6 border-b" style={{ borderColor: '#E0DDD8' }}>
        {[
          { v: 'fluxo',          l: 'Fluxo mensal',     icon: TrendingUp },
          { v: 'aging',          l: 'A receber',        icon: AlertTriangle },
          { v: 'cliente',        l: 'Por cliente',      icon: Users },
          { v: 'emissor',        l: 'Por emissor',      icon: Building2 },
          { v: 'mensal_emissor', l: 'Mensal × emissor', icon: Grid3X3 },
        ].map((t) => {
          const ativo = aba === t.v
          return (
            <button
              key={t.v}
              onClick={() => setAba(t.v as any)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all"
              style={{
                color: ativo ? '#1A1C1E' : '#888',
                borderBottom: ativo ? '2px solid #FFAF06' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              <t.icon className="w-4 h-4" />
              {t.l}
            </button>
          )
        })}
      </div>

      {aba === 'fluxo'          && <RelatorioFluxo ano={ano} />}
      {aba === 'aging'          && <RelatorioAging emissorId={filtroEmissor} />}
      {aba === 'cliente'        && <RelatorioPorCliente ano={ano} emissorId={filtroEmissor} />}
      {aba === 'emissor'        && <RelatorioPorEmissor ano={ano} />}
      {aba === 'mensal_emissor' && <RelatorioMensalPorEmissor ano={ano} />}
    </div>
  )
}

function RelatorioFluxo({ ano }: { ano: number }) {
  const [data, setData] = useState<any[] | null>(null)
  useEffect(() => {
    setData(null)
    api.get(`/financeiro/fluxo/${ano}`).then((r) => setData(r.data))
  }, [ano])

  if (!data) return <Loading />
  const max = Math.max(1, ...data.map((d: any) => Math.max(d.receita, d.despesas)))
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const totalReceita = data.reduce((s, d) => s + d.receita, 0)
  const totalDesp = data.reduce((s, d) => s + d.despesas, 0)
  const saldo = totalReceita - totalDesp

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Receita total" valor={totalReceita} cor="#27AE60" />
        <KpiCard label="Despesa total" valor={totalDesp} cor="#E74C3C" />
        <KpiCard label="Saldo" valor={saldo} cor={saldo >= 0 ? '#27AE60' : '#E74C3C'} />
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className="font-semibold text-gray-900 mb-4">Receita × Despesa por mês ({ano})</h3>
        <div className="grid grid-cols-12 gap-2 items-end" style={{ minHeight: 200 }}>
          {data.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="flex items-end gap-0.5 w-full" style={{ height: 180 }}>
                <div className="flex-1 rounded-t" style={{ background: '#27AE60', height: `${(d.receita / max) * 100}%`, minHeight: d.receita > 0 ? 2 : 0 }} title={`Receita: ${fmt(d.receita)}`} />
                <div className="flex-1 rounded-t" style={{ background: '#E74C3C', height: `${(d.despesas / max) * 100}%`, minHeight: d.despesas > 0 ? 2 : 0 }} title={`Despesa: ${fmt(d.despesas)}`} />
              </div>
              <div className="text-[10px] text-gray-500">{meses[i]}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-4 justify-center">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: '#27AE60' }} /> Receita</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: '#E74C3C' }} /> Despesa</div>
        </div>
      </div>
    </div>
  )
}

function RelatorioAging({ emissorId }: { emissorId?: string }) {
  const [data, setData] = useState<any | null>(null)
  const [incluirFuturo, setIncluirFuturo] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [clientes, setClientes] = useState<any[]>([])
  const [clienteId, setClienteId] = useState('')

  useEffect(() => {
    api.get('/clientes').then((r) => setClientes(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setData(null)
    const params: any = {}
    if (emissorId) params.emissorId = emissorId
    if (incluirFuturo) params.incluirFuturo = 'true'
    if (clienteId) params.clienteId = clienteId
    if (dataInicio) params.dataInicio = dataInicio
    if (dataFim) params.dataFim = dataFim
    api.get('/financeiro/relatorios/aging', { params }).then((r) => setData(r.data))
  }, [emissorId, incluirFuturo, clienteId, dataInicio, dataFim])

  const cores: Record<string, string> = {
    a_vencer: '#1A5276',
    ate_30: '#FFAF06',
    de_31_60: '#E67E22',
    de_61_90: '#E74C3C',
    mais_90: '#8B0000',
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 flex items-center gap-3 flex-wrap" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={incluirFuturo}
            onChange={(e) => setIncluirFuturo(e.target.checked)}
            style={{ accentColor: '#FFAF06' }}
          />
          Incluir FUTURO (faturas ainda não vencidas)
        </label>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">De</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          />
          <label className="text-xs text-gray-500">até</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          />
        </div>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm outline-none flex-1 min-w-[180px]"
          style={{ border: '1px solid #E0DDD8', ...(clienteId && { background: '#FEF3E2', color: '#633806', fontWeight: 500 }) }}
        >
          <option value="">Todos os clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.razaoSocial}</option>
          ))}
        </select>
        {(incluirFuturo || dataInicio || dataFim || clienteId) && (
          <button
            type="button"
            onClick={() => { setIncluirFuturo(false); setDataInicio(''); setDataFim(''); setClienteId('') }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Limpar
          </button>
        )}
      </div>

      {!data ? <Loading /> : <>
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-semibold text-gray-900">A receber consolidado</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{fmt(data.total)}</div>
            <div className="text-xs text-gray-500">{data.quantidade} fatura(s)</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {Object.entries(data.faixas).map(([key, f]: any) => (
            <div key={key} className="rounded-xl p-4" style={{ background: '#FBFAF7', border: `1px solid ${cores[key]}33` }}>
              <div className="text-xs font-medium" style={{ color: cores[key] }}>{f.label}</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{fmt(f.valor)}</div>
              <div className="text-xs text-gray-500">{f.quantidade} fatura(s)</div>
            </div>
          ))}
        </div>
      </div>

      {Object.entries(data.faixas).map(([key, f]: any) => f.quantidade > 0 && (
        <div key={key} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: cores[key] }}>{f.label} — {fmt(f.valor)}</h4>
          <div className="space-y-1">
            {f.lancs.map((l: any) => (
              <div key={l.id} className="flex items-center gap-3 text-sm py-2 border-b last:border-0" style={{ borderColor: '#F1EFE8' }}>
                <span className="font-medium text-gray-900 w-20">{l.numeroFatura ? `NF ${l.numeroFatura}` : '—'}</span>
                <span className="flex-1 truncate text-gray-700">{l.cliente}</span>
                <span className="text-xs text-gray-500 w-24">Venc {fmtDate(l.dtVencimento)}</span>
                {l.diasAtraso > 0 && <span className="text-xs font-medium" style={{ color: cores[key] }}>{l.diasAtraso}d</span>}
                <span className="font-semibold text-gray-900 w-28 text-right">{fmt(l.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      </>}
    </div>
  )
}

function RelatorioPorCliente({ ano, emissorId }: { ano: number; emissorId?: string }) {
  const [data, setData] = useState<any[] | null>(null)
  useEffect(() => {
    setData(null)
    const params: any = { ano }
    if (emissorId) params.emissorId = emissorId
    api.get('/financeiro/relatorios/por-cliente', { params }).then((r) => setData(r.data))
  }, [ano, emissorId])

  if (!data) return <Loading />
  const total = data.reduce((s, c) => s + c.totalFaturado, 0)
  const max = Math.max(1, ...data.map((c) => c.totalFaturado))

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Faturamento por cliente em {ano}</h3>
          <div className="text-2xl font-bold text-gray-900">{fmt(total)}</div>
        </div>
        {data.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Nenhum faturamento no período</div>
        ) : (
          <div className="space-y-2">
            {data.map((c, idx) => (
              <div key={idx} className="py-2 border-b last:border-0" style={{ borderColor: '#F1EFE8' }}>
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="font-semibold text-gray-900 text-sm flex-1 truncate">{c.razaoSocial}</span>
                  <span className="text-xs text-gray-500">{c.quantidade} fatura(s)</span>
                  <span className="font-bold text-gray-900 w-32 text-right">{fmt(c.totalFaturado)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${(c.totalFaturado / max) * 100}%`, background: '#FFAF06' }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-32 text-right">
                    Pago {fmt(c.totalPago)} · A receber {fmt(c.aReceber)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RelatorioPorEmissor({ ano }: { ano: number }) {
  const [data, setData] = useState<any[] | null>(null)
  useEffect(() => {
    setData(null)
    api.get('/financeiro/relatorios/por-emissor', { params: { ano } }).then((r) => setData(r.data))
  }, [ano])

  if (!data) return <Loading />
  const total = data.reduce((s, c) => s + c.totalFaturado, 0)
  const cores = ['#FFAF06', '#1A5276', '#27500A', '#8B0000']

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Faturamento por emissor em {ano}</h3>
          <div className="text-2xl font-bold text-gray-900">{fmt(total)}</div>
        </div>
        {data.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Nenhum faturamento no período</div>
        ) : (
          <div className="space-y-3">
            {data.map((em, idx) => {
              const pct = total > 0 ? (em.totalFaturado / total) * 100 : 0
              const cor = cores[idx % cores.length]
              return (
                <div key={idx} className="rounded-xl p-4" style={{ background: '#FBFAF7', border: `1px solid ${cor}33` }}>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="font-semibold text-gray-900 flex-1">{em.razaoSocial}</span>
                    <span className="text-sm text-gray-500">{em.quantidade} fatura(s)</span>
                    <span className="font-bold text-lg" style={{ color: cor }}>{fmt(em.totalFaturado)}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-1">
                    <div className="h-full" style={{ width: `${pct}%`, background: cor }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{pct.toFixed(1)}% do total</span>
                    <span>Pago {fmt(em.totalPago)} · A receber {fmt(em.aReceber)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function RelatorioMensalPorEmissor({ ano }: { ano: number }) {
  const [data, setData] = useState<any | null>(null)
  useEffect(() => {
    setData(null)
    api.get('/financeiro/relatorios/mensal-por-emissor', { params: { ano } })
      .then((r) => setData(r.data))
  }, [ano])

  if (!data) return <Loading />
  const cores = ['#FFAF06', '#1A5276', '#27500A', '#8B0000']
  const max = Math.max(1, ...data.dados.map((d: any) => d.total))

  return (
    <div className="space-y-6">
      {/* KPIs por emissor (totais do ano) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Total geral do ano" valor={data.totalGeral} cor="#1A1C1E" />
        {data.emissores.slice(0, 2).map((em: any, idx: number) => (
          <KpiCard
            key={em.id}
            label={em.nomeFantasia || em.razaoSocial}
            valor={data.totaisPorEmissor[em.id] || 0}
            cor={cores[idx % cores.length]}
          />
        ))}
      </div>

      {/* Gráfico de barras agrupadas */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className="font-semibold text-gray-900 mb-4">Faturamento mensal por emissor ({ano})</h3>
        <div className="grid grid-cols-12 gap-2 items-end" style={{ minHeight: 200 }}>
          {data.dados.map((d: any) => (
            <div key={d.mes} className="flex flex-col items-center gap-1">
              <div className="flex items-end gap-0.5 w-full" style={{ height: 180 }}>
                {data.emissores.map((em: any, idx: number) => {
                  const v = d.valores[em.id] || 0
                  return (
                    <div
                      key={em.id}
                      className="flex-1 rounded-t"
                      style={{
                        background: cores[idx % cores.length],
                        height: `${(v / max) * 100}%`,
                        minHeight: v > 0 ? 2 : 0,
                      }}
                      title={`${em.nomeFantasia || em.razaoSocial} — ${d.nome}: ${fmt(v)}`}
                    />
                  )
                })}
              </div>
              <div className="text-[10px] text-gray-500">{d.nome}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-4 justify-center flex-wrap">
          {data.emissores.map((em: any, idx: number) => (
            <div key={em.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: cores[idx % cores.length] }} />
              {em.nomeFantasia || em.razaoSocial}
            </div>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl p-5 overflow-x-auto" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: '#E0DDD8' }}>
              <th className="text-left py-2 px-2 font-semibold text-gray-700">Mês</th>
              {data.emissores.map((em: any) => (
                <th key={em.id} className="text-right py-2 px-2 font-semibold text-gray-700">
                  {em.nomeFantasia || em.razaoSocial}
                </th>
              ))}
              <th className="text-right py-2 px-2 font-semibold text-gray-900">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.dados.map((d: any, idx: number) => (
              <tr key={d.mes} className="border-b" style={{ borderColor: '#F1EFE8', background: idx % 2 === 1 ? '#FBFAF7' : '#fff' }}>
                <td className="py-2 px-2 text-gray-700 font-medium">{d.nome}</td>
                {data.emissores.map((em: any) => (
                  <td key={em.id} className="text-right py-2 px-2 text-gray-700 tabular-nums">
                    {d.valores[em.id] ? fmt(d.valores[em.id]) : '—'}
                  </td>
                ))}
                <td className="text-right py-2 px-2 font-semibold text-gray-900 tabular-nums">
                  {d.total > 0 ? fmt(d.total) : '—'}
                </td>
              </tr>
            ))}
            <tr style={{ background: '#FEF3E2', borderTop: '2px solid #FFAF06' }}>
              <td className="py-2.5 px-2 font-bold text-gray-900">Total do ano</td>
              {data.emissores.map((em: any) => (
                <td key={em.id} className="text-right py-2.5 px-2 font-bold text-gray-900 tabular-nums">
                  {fmt(data.totaisPorEmissor[em.id] || 0)}
                </td>
              ))}
              <td className="text-right py-2.5 px-2 font-bold text-gray-900 tabular-nums">{fmt(data.totalGeral)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KpiCard({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color: cor }}>{fmt(valor)}</div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FFAF06' }} />
    </div>
  )
}
