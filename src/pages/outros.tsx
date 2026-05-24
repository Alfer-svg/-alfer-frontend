// Financeiro — receitas + despesas + filtros + modal nova despesa
import { useState, useEffect, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { FornecedorModal } from './Fornecedores'
import { DollarSign, TrendingUp, TrendingDown, Clock, FileDown, XCircle, Trash2, AlertCircle, CheckCircle2, Plus, X, Loader2, ArrowDownCircle, ArrowUpCircle, Banknote, Copy, RefreshCw, QrCode, Mail, Send } from 'lucide-react'

const CATEGORIAS: { v: string; l: string }[] = [
  { v: 'MANUTENCAO',         l: 'Manutenção' },
  { v: 'COMBUSTIVEL',        l: 'Combustível' },
  { v: 'SEGURO',             l: 'Seguro' },
  { v: 'OPERACIONAL',        l: 'Operacional' },
  { v: 'PESSOAL',            l: 'Pessoal (salários, pró-labore)' },
  { v: 'ADMINISTRATIVO',     l: 'Administrativo' },
  { v: 'ALUGUEL',            l: 'Aluguel' },
  { v: 'IMPOSTOS',           l: 'Impostos / Taxas' },
  { v: 'FRETE',              l: 'Frete (terceiros)' },
  { v: 'DOCUMENTACAO',       l: 'Documentação / Licenciamento' },
  { v: 'ENERGIA_AGUA',       l: 'Energia / Água' },
  { v: 'TELEFONIA_INTERNET', l: 'Telefonia / Internet' },
  { v: 'MARKETING',          l: 'Marketing' },
  { v: 'EQUIPAMENTO',        l: 'Equipamento (compra)' },
  { v: 'SOFTWARE',           l: 'Software / SaaS' },
  { v: 'FINANCEIRO',         l: 'Financeiro (juros, tarifas)' },
  { v: 'OUTROS',             l: 'Outros' },
]

const STATUS: { v: string; l: string }[] = [
  { v: 'FUTURO',       l: 'Futuro' },
  { v: 'PENDENTE',     l: 'Pendente' },
  { v: 'PAGO',         l: 'Pago' },
  { v: 'VENCIDO',      l: 'Vencido' },
  { v: 'INADIMPLENTE', l: 'Inadimplente' },
  { v: 'CANCELADO',    l: 'Cancelado' },
]

function extrairFilename(headerValue: string | null, fallback: string): string {
  if (!headerValue) return fallback
  const utf8 = headerValue.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8) { try { return decodeURIComponent(utf8[1]) } catch {} }
  const plain = headerValue.match(/filename="?([^";]+)"?/i)
  if (plain) return plain[1]
  return fallback
}

async function abrirFaturaPdf(id: string) {
  try {
    const token = localStorage.getItem('alfer_token')
    const baseUrl = (api.defaults.baseURL || '').replace(/\/$/, '')
    const r = await fetch(`${baseUrl}/financeiro/lancamentos/${id}/fatura-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) throw new Error('Erro ao gerar fatura')
    const filename = extrairFilename(r.headers.get('content-disposition'), `fatura-${id}.pdf`)
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  } catch (err: any) {
    alert(err.message || 'Erro ao baixar fatura.')
  }
}

function sanitizarFilename(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function montarNomeBoleto(lanc: any): string {
  const numero = lanc.numeroFatura ? String(lanc.numeroFatura) : lanc.id.slice(-6).toUpperCase()
  const cliente = sanitizarFilename(lanc.cliente?.razaoSocial || 'sem-cliente')
  const venc = lanc.dtVencimento
    ? new Date(lanc.dtVencimento).toLocaleDateString('pt-BR').replace(/\//g, '-')
    : 'sem-data'
  return `BOLETO ${numero} ${cliente} ${venc}.pdf`
}

async function abrirBoletoInter(lanc: any) {
  try {
    const token = localStorage.getItem('alfer_token')
    const baseUrl = (api.defaults.baseURL || '').replace(/\/$/, '')
    const r = await fetch(`${baseUrl}/inter/lancamentos/${lanc.id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) throw new Error('Erro ao baixar boleto')
    const filename = montarNomeBoleto(lanc)
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  } catch (err: any) {
    alert(err.message || 'Erro ao baixar boleto.')
  }
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

export function Financeiro() {
  const [dash, setDash] = useState<any>(null)
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [erroAcao, setErroAcao] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'' | 'RECEITA' | 'DESPESA'>('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [novaDespesaModal, setNovaDespesaModal] = useState(false)
  const [enviarEmailModal, setEnviarEmailModal] = useState<any>(null)

  const carregar = () => {
    const params: any = {}
    if (filtroTipo) params.tipo = filtroTipo
    if (filtroStatus) params.status = filtroStatus
    return Promise.all([
      api.get('/financeiro/dashboard'),
      api.get('/financeiro/lancamentos', { params }),
    ]).then(([d, l]) => {
      setDash(d.data)
      setLancamentos(l.data)
    })
  }

  useEffect(() => {
    setLoading(true)
    carregar().finally(() => setLoading(false))
  }, [filtroTipo, filtroStatus])

  const marcarPago = async (l: any) => {
    const hoje = new Date().toISOString().slice(0, 10)
    const dt = prompt(
      `Marcar ${l.tipo === 'RECEITA' ? 'fatura' : 'despesa'} (R$ ${l.valor}) como PAGA.\n\nData do pagamento (AAAA-MM-DD):`,
      hoje,
    )
    if (!dt) return
    setErroAcao('')
    try {
      await api.put(`/financeiro/lancamentos/${l.id}/pagar`, { dtPagamento: dt })
      await carregar()
    } catch (e: any) {
      setErroAcao(e.response?.data?.message || 'Erro ao marcar como pago')
    }
  }

  const cancelar = async (l: any) => {
    if (!confirm(`Cancelar a ${l.tipo === 'RECEITA' ? 'fatura' : 'despesa'} de ${l.cliente?.razaoSocial || l.fornecedor || 'sem cliente'} no valor de R$ ${l.valor}?`)) return
    setErroAcao('')
    try {
      await api.put(`/financeiro/lancamentos/${l.id}/cancelar`)
      await carregar()
    } catch (e: any) {
      setErroAcao(e.response?.data?.message || 'Erro ao cancelar')
    }
  }

  const emitirBoleto = async (l: any) => {
    if (!confirm(`Gerar boleto + Pix no Banco Inter pra ${l.cliente?.razaoSocial} (R$ ${l.valor})?`)) return
    setErroAcao('')
    try {
      await api.post(`/inter/lancamentos/${l.id}/emitir`)
      await carregar()
    } catch (e: any) {
      setErroAcao(e.response?.data?.message || 'Erro ao gerar boleto')
    }
  }

  const sincronizarInter = async (l: any) => {
    setErroAcao('')
    try {
      const r = await api.post(`/inter/lancamentos/${l.id}/sincronizar`)
      await carregar()
      const status = r.data?.interStatus || '?'
      alert(`Status atualizado: ${status}`)
    } catch (e: any) {
      setErroAcao(e.response?.data?.message || 'Erro ao sincronizar')
    }
  }

  const cancelarBoleto = async (l: any) => {
    if (!confirm('Cancelar o boleto no Banco Inter? Esta ação NÃO pode ser desfeita no Inter.')) return
    setErroAcao('')
    try {
      await api.post(`/inter/lancamentos/${l.id}/cancelar`, { motivo: 'Cancelado pelo emitente' })
      await carregar()
    } catch (e: any) {
      setErroAcao(e.response?.data?.message || 'Erro ao cancelar boleto')
    }
  }

  const copiar = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto)
    alert(`${label} copiado!`)
  }

  const excluir = async (l: any) => {
    if (!confirm(`EXCLUIR PERMANENTEMENTE? Não dá pra desfazer. Se quiser preservar histórico, use Cancelar.`)) return
    if (!confirm('Confirma a exclusão?')) return
    setErroAcao('')
    try {
      await api.delete(`/financeiro/lancamentos/${l.id}`)
      await carregar()
    } catch (e: any) {
      setErroAcao(e.response?.data?.message || 'Erro ao excluir')
    }
  }

  const statusColor: Record<string, string> = {
    PAGO: '#27AE60', PENDENTE: '#FFAF06', FUTURO: '#2D80D1', VENCIDO: '#E74C3C', INADIMPLENTE: '#8B0000', CANCELADO: '#888',
  }
  const statusBg: Record<string, string> = {
    PAGO: '#EAF3DE', PENDENTE: '#FEF3E2', FUTURO: '#E3EEFA', VENCIDO: '#FDEEEE', INADIMPLENTE: '#FDEEEE', CANCELADO: '#F1EFE8',
  }

  if (loading && !dash) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1">Receitas, despesas e fluxo de caixa</p>
        </div>
        <button
          onClick={() => setNovaDespesaModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-900 hover:opacity-90"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" /> Nova despesa
        </button>
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

      {erroAcao && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erroAcao}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {/* Tabs Tipo */}
        <div className="flex gap-1 p-1 rounded-xl bg-white" style={{ border: '1px solid #E0DDD8' }}>
          {[
            { v: '', l: 'Todos', icon: null },
            { v: 'RECEITA', l: 'Receitas', icon: ArrowUpCircle },
            { v: 'DESPESA', l: 'Despesas', icon: ArrowDownCircle },
          ].map((t) => (
            <button
              key={t.v || 'all'}
              onClick={() => setFiltroTipo(t.v as any)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filtroTipo === t.v ? (t.v === 'RECEITA' ? '#27AE60' : t.v === 'DESPESA' ? '#E74C3C' : '#1A1C1E') : 'transparent',
                color: filtroTipo === t.v ? 'white' : '#555',
              }}
            >
              {t.icon && <t.icon className="w-3.5 h-3.5" />} {t.l}
            </button>
          ))}
        </div>
        {/* Filtro de status */}
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-3 py-2 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos os status</option>
          {STATUS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
        <span className="text-xs text-gray-500 ml-auto">{lancamentos.length} lançamento(s)</span>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="divide-y divide-gray-50">
          {lancamentos.map((l) => {
            const catLabel = l.categoria ? CATEGORIAS.find((c) => c.v === l.categoria)?.l : null
            return (
              <div key={l.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2`} style={{ background: l.tipo === 'RECEITA' ? '#27AE60' : '#E74C3C' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                      {l.tipo === 'RECEITA' && l.numeroFatura && (
                        <span className="font-display font-bold text-gray-900 text-base">NF {l.numeroFatura}</span>
                      )}
                      {l.tipo === 'RECEITA' && !l.numeroFatura && (
                        <span className="font-display font-bold text-gray-900 text-base">Fatura</span>
                      )}
                      {l.tipo === 'DESPESA' && (
                        <span className="font-display font-bold text-gray-900 text-base">Despesa</span>
                      )}
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {l.cliente?.razaoSocial || l.fornecedor || '—'}
                      </span>
                      {catLabel && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#F1EFE8', color: '#666' }}>
                          {catLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{l.descricao}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Vence: {fmtDate(l.dtVencimento)}
                      {l.dtPagamento && ` • Pago: ${fmtDate(l.dtPagamento)}`}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold" style={{ color: l.tipo === 'RECEITA' ? '#27AE60' : '#E74C3C' }}>
                      {l.tipo === 'RECEITA' ? '+' : '-'}{fmt(l.valor)}
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: statusBg[l.status] || '#F1EFE8', color: statusColor[l.status] || '#888' }}>
                      {l.status}
                    </div>
                  </div>
                </div>
                {l.tipo === 'RECEITA' && l.interCodigoSolicitacao && (
                  <div className="mt-3 ml-5 p-2.5 rounded-xl flex items-center gap-2 flex-wrap" style={{
                    background: l.interStatus === 'RECEBIDO' ? '#EAF3DE' : '#FFF8E6',
                    border: `1px solid ${l.interStatus === 'RECEBIDO' ? '#C5DDA2' : '#FFD577'}`,
                  }}>
                    <Banknote className="w-4 h-4 text-orange-700" />
                    <span className="text-xs font-semibold text-gray-700">Boleto Inter:</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                      background: l.interStatus === 'RECEBIDO' ? '#27500A' : '#FFAF06',
                      color: 'white',
                    }}>
                      {l.interStatus}
                    </span>
                    {l.interLinhaDigitavel && (
                      <button
                        onClick={() => copiar(l.interLinhaDigitavel, 'Linha digitável')}
                        className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white"
                        title={l.interLinhaDigitavel}
                      >
                        <Copy className="w-3 h-3" /> Linha digitável
                      </button>
                    )}
                    {l.interPixCopiaCola && (
                      <button
                        onClick={() => copiar(l.interPixCopiaCola, 'Pix copia e cola')}
                        className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white"
                      >
                        <QrCode className="w-3 h-3" /> Pix copia e cola
                      </button>
                    )}
                    <button
                      onClick={() => abrirBoletoInter(l)}
                      className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white"
                    >
                      <FileDown className="w-3 h-3" /> PDF do boleto
                    </button>
                    {l.interStatus !== 'RECEBIDO' && l.interStatus !== 'CANCELADO' && (
                      <>
                        <button
                          onClick={() => sincronizarInter(l)}
                          title="Consultar status no Inter"
                          className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white"
                        >
                          <RefreshCw className="w-3 h-3" /> Sincronizar
                        </button>
                        <button
                          onClick={() => cancelarBoleto(l)}
                          className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-md text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-3 h-3" /> Cancelar boleto
                        </button>
                      </>
                    )}
                  </div>
                )}
                {(l.tipo === 'RECEITA' || l.status !== 'PAGO') && (
                  <div className="flex gap-2 flex-wrap mt-3 ml-5">
                    {l.tipo === 'RECEITA' && (
                      <button
                        onClick={() => abrirFaturaPdf(l.id)}
                        title="Gerar fatura em PDF"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                        style={{ border: '1px solid #E0DDD8' }}
                      >
                        <FileDown className="w-3 h-3" /> PDF
                      </button>
                    )}
                    {l.tipo === 'RECEITA' && l.status !== 'PAGO' && l.status !== 'CANCELADO' && !l.interCodigoSolicitacao && (
                      <button
                        onClick={() => emitirBoleto(l)}
                        title="Gerar boleto + Pix no Banco Inter"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white"
                        style={{ background: '#FF6800' }}
                      >
                        <Banknote className="w-3 h-3" /> Boleto Inter
                      </button>
                    )}
                    {l.tipo === 'RECEITA' && (
                      <button
                        onClick={() => setEnviarEmailModal(l)}
                        title={l.emailEnviadoEm ? `Já enviado em ${new Date(l.emailEnviadoEm).toLocaleString('pt-BR')}` : 'Enviar fatura + boleto por e-mail'}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{
                          background: l.emailEnviadoEm ? '#EAF3DE' : '#E3EEFA',
                          color: l.emailEnviadoEm ? '#27500A' : '#1A5276',
                          border: `1px solid ${l.emailEnviadoEm ? '#C5DDA2' : '#B8D6EE'}`,
                        }}
                      >
                        <Mail className="w-3 h-3" /> {l.emailEnviadoEm ? 'Reenviar e-mail' : 'Enviar por e-mail'}
                      </button>
                    )}
                    {l.status !== 'PAGO' && l.status !== 'CANCELADO' && (
                      <button
                        onClick={() => marcarPago(l)}
                        title={l.tipo === 'RECEITA' ? 'Receber pagamento' : 'Marcar despesa como paga'}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white hover:opacity-90"
                        style={{ background: '#27AE60' }}
                      >
                        <CheckCircle2 className="w-3 h-3" /> {l.tipo === 'RECEITA' ? 'Receber' : 'Pagar'}
                      </button>
                    )}
                    {l.status !== 'PAGO' && l.status !== 'CANCELADO' && (
                      <button
                        onClick={() => cancelar(l)}
                        title="Cancelar (mantém histórico)"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                        style={{ border: '1px solid #E0DDD8' }}
                      >
                        <XCircle className="w-3 h-3" /> Cancelar
                      </button>
                    )}
                    {l.status !== 'PAGO' && (
                      <button
                        onClick={() => excluir(l)}
                        title="Excluir permanentemente"
                        className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-600 hover:bg-red-50"
                        style={{ border: '1px solid #FACACA' }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {lancamentos.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhum lançamento encontrado</div>
          )}
        </div>
      </div>

      {novaDespesaModal && (
        <NovaDespesaModal
          onClose={() => setNovaDespesaModal(false)}
          onSaved={() => { setNovaDespesaModal(false); carregar() }}
        />
      )}
      {enviarEmailModal && (
        <EnviarEmailModal
          lancamento={enviarEmailModal}
          onClose={() => setEnviarEmailModal(null)}
          onSent={() => { setEnviarEmailModal(null); carregar() }}
        />
      )}
    </div>
  )
}

function EnviarEmailModal({ lancamento, onClose, onSent }: { lancamento: any; onClose: () => void; onSent: () => void }) {
  const [loading, setLoading] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [preview, setPreview] = useState<any>(null)
  const [form, setForm] = useState({
    destinatario: '',
    cc: '',
    assunto: '',
    corpo: '',
    anexarFatura: true,
    anexarBoleto: !!lancamento.interCodigoSolicitacao,
  })

  useEffect(() => {
    setLoading(true)
    api.post(`/email/lancamentos/${lancamento.id}/preview`)
      .then((r) => {
        setPreview(r.data)
        setForm((f) => ({
          ...f,
          destinatario: r.data.destinatarioSugerido || '',
          assunto: r.data.assunto || '',
          corpo: r.data.texto || '',
        }))
      })
      .catch((e) => setErro(e.response?.data?.message || 'Erro ao carregar preview'))
      .finally(() => setLoading(false))
  }, [lancamento.id])

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.destinatario || !/.+@.+/.test(form.destinatario)) return setErro('E-mail destinatário inválido')
    setEnviando(true); setErro('')
    try {
      const r = await api.post(`/email/lancamentos/${lancamento.id}/enviar`, form)
      alert(`✓ E-mail enviado pra ${form.destinatario}\n${r.data.anexos || 0} anexo(s)`)
      onSent()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao enviar e-mail')
    } finally {
      setEnviando(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  if (loading) return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    </Modal>
  )

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" /> Enviar fatura por e-mail
        </h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        {lancamento.numeroFatura ? `NF ${lancamento.numeroFatura}` : 'Fatura'} — {lancamento.cliente?.razaoSocial}
        {lancamento.emailEnviadoEm && (
          <span className="ml-2 text-orange-600">⚠ Já enviado em {new Date(lancamento.emailEnviadoEm).toLocaleString('pt-BR')}</span>
        )}
      </p>

      <form onSubmit={enviar} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Para *</label>
          <input
            type="email"
            value={form.destinatario}
            onChange={(e) => setForm({ ...form, destinatario: e.target.value })}
            placeholder="cliente@empresa.com.br"
            className={inputCls}
            style={inputStyle}
            required
          />
          {!preview?.destinatarioSugerido && (
            <p className="text-xs text-orange-600 mt-1">⚠ Cliente sem e-mail cadastrado. Preencha o destinatário manualmente.</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Cópia (CC) — separar por vírgula</label>
          <input
            value={form.cc}
            onChange={(e) => setForm({ ...form, cc: e.target.value })}
            placeholder="financeiro@cliente.com, gerente@cliente.com"
            className={inputCls}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Assunto</label>
          <input
            value={form.assunto}
            onChange={(e) => setForm({ ...form, assunto: e.target.value })}
            className={inputCls}
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Mensagem</label>
          <textarea
            value={form.corpo}
            onChange={(e) => setForm({ ...form, corpo: e.target.value })}
            rows={10}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none font-mono"
            style={inputStyle}
          />
          <p className="text-xs text-gray-400 mt-1">
            Pode editar livre. Se tem boleto Inter, a linha digitável + Pix já estão incluídos.
          </p>
        </div>

        <div className="p-3 rounded-xl space-y-2" style={{ background: '#F9F7F4', border: '1px solid #E0DDD8' }}>
          <div className="text-xs font-medium text-gray-700">📎 Anexos</div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.anexarFatura}
              onChange={(e) => setForm({ ...form, anexarFatura: e.target.checked })}
              className="w-4 h-4"
              style={{ accentColor: '#FFAF06' }}
            />
            <span>Fatura (PDF da NF)</span>
          </label>
          {preview?.temBoletoInter && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.anexarBoleto}
                onChange={(e) => setForm({ ...form, anexarBoleto: e.target.checked })}
                className="w-4 h-4"
                style={{ accentColor: '#FFAF06' }}
              />
              <span>Boleto Inter (PDF)</span>
            </label>
          )}
          {!preview?.temBoletoInter && (
            <p className="text-xs text-gray-500">⚠ Sem boleto Inter emitido. Gere o boleto antes se quiser anexar.</p>
          )}
        </div>

        {erro && <div className="text-xs text-red-700 flex items-center gap-2 p-2 rounded-lg bg-red-50"><AlertCircle className="w-3 h-3" /> {erro}</div>}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button
            type="submit"
            disabled={enviando || !form.destinatario}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: enviando ? '#1A5276' : '#2D80D1' }}
          >
            {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {enviando ? 'Enviando...' : 'Enviar e-mail'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function NovaDespesaModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    dtVencimento: new Date().toISOString().slice(0, 10),
    categoria: 'OPERACIONAL',
    fornecedorId: '',
    status: 'PENDENTE',
    dtPagamento: '',
    observacoes: '',
  })
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [novoFornModal, setNovoFornModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const loadFornecedores = () =>
    api.get('/fornecedores', { params: { ativo: 'true' } }).then((r) => setFornecedores(r.data))

  useEffect(() => { loadFornecedores() }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.descricao) return setErro('Descrição é obrigatória.')
    if (!form.valor || Number(form.valor) <= 0) return setErro('Valor inválido.')
    setLoading(true); setErro('')
    try {
      const payload: any = {
        tipo: 'DESPESA',
        descricao: form.descricao,
        valor: Number(form.valor),
        dtVencimento: form.dtVencimento,
        categoria: form.categoria,
        fornecedorId: form.fornecedorId || undefined,
        observacoes: form.observacoes || undefined,
      }
      // Se já vai criar como paga, manda o pagamento via /pagar depois
      const r = await api.post('/financeiro/lancamentos', payload)
      if (form.status === 'PAGO') {
        await api.put(`/financeiro/lancamentos/${r.data.id}/pagar`, {
          dtPagamento: form.dtPagamento || form.dtVencimento,
        })
      }
      onSaved()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <ArrowDownCircle className="w-5 h-5 text-red-600" /> Nova despesa
        </h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Descrição *</label>
          <input
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Ex: Conta de luz — Maio/2026"
            className={inputCls}
            style={inputStyle}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Valor (R$) *</label>
            <input
              type="number" step="0.01" min="0"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder="0,00"
              className={inputCls}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Vencimento *</label>
            <input
              type="date"
              value={form.dtVencimento}
              onChange={(e) => setForm({ ...form, dtVencimento: e.target.value })}
              className={inputCls}
              style={inputStyle}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Categoria</label>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className={inputCls}
              style={inputStyle}
            >
              {CATEGORIAS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center justify-between">
              Fornecedor
              <button
                type="button"
                onClick={() => setNovoFornModal(true)}
                className="text-[10px] text-orange-600 hover:underline"
              >
                + novo
              </button>
            </label>
            <select
              value={form.fornecedorId}
              onChange={(e) => {
                const id = e.target.value
                setForm({ ...form, fornecedorId: id })
                // Auto-preenche categoria se fornecedor tem padrão e categoria ainda é a default
                const f = fornecedores.find((x) => x.id === id)
                if (f?.categoriaPadrao && form.categoria === 'OPERACIONAL') {
                  setForm((cur) => ({ ...cur, fornecedorId: id, categoria: f.categoriaPadrao }))
                }
              }}
              className={inputCls}
              style={inputStyle}
            >
              <option value="">— sem fornecedor —</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}{f.nomeFantasia && f.nomeFantasia !== f.nome ? ` (${f.nomeFantasia})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputCls}
              style={inputStyle}
            >
              <option value="PENDENTE">Pendente (a pagar)</option>
              <option value="FUTURO">Futuro</option>
              <option value="PAGO">Pago (já quitada)</option>
            </select>
          </div>
          {form.status === 'PAGO' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data de pagamento</label>
              <input
                type="date"
                value={form.dtPagamento}
                onChange={(e) => setForm({ ...form, dtPagamento: e.target.value })}
                className={inputCls}
                style={inputStyle}
              />
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Observações</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
            style={inputStyle}
          />
        </div>
        {erro && <div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Cadastrar
          </button>
        </div>
      </form>

      {novoFornModal && (
        <FornecedorModal
          fornecedor={null}
          onClose={() => setNovoFornModal(false)}
          onSaved={async (novo) => {
            setNovoFornModal(false)
            await loadFornecedores()
            if (novo?.id) setForm((f) => ({ ...f, fornecedorId: novo.id, categoria: novo.categoriaPadrao || f.categoria }))
          }}
        />
      )}
    </Modal>
  )
}
