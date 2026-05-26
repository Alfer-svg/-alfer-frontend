// Financeiro — receitas + despesas + filtros + modal nova despesa
import { useState, useEffect, FormEvent } from 'react'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { FornecedorModal } from './Fornecedores'
import { DollarSign, TrendingUp, TrendingDown, Clock, FileDown, XCircle, Trash2, AlertCircle, CheckCircle2, Plus, X, Loader2, ArrowDownCircle, ArrowUpCircle, Banknote, Copy, RefreshCw, QrCode, Mail, Send, MessageCircle, Star, Building2 } from 'lucide-react'
import { fmtDate } from '../utils/data'

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
  const venc = lanc.dtVencimento ? fmtDate(lanc.dtVencimento).replace(/\//g, '-') : 'sem-data'
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
/** Abrevia razão social do emissor pro chip discreto no Financeiro.
 * "ALBUQUERQUE E ARAUJO ENGENHARIA LTDA" → "Albuquerque e Araújo"
 * "ALFER ALUGUEL DE CONTAINERS LTDA"     → "Alfer"
 */
function abreviarEmissor(razaoSocial: string): string {
  if (!razaoSocial) return ''
  const s = razaoSocial.toLowerCase()
  if (s.startsWith('alfer')) return 'Alfer'
  if (s.startsWith('albuquerque')) return 'Albuquerque'
  // Genérico: primeiras 2 palavras "humanizadas"
  return razaoSocial
    .replace(/\bLTDA\b|\bS\.?A\.?\b|\bME\b|\bEIRELI\b/gi, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function limparTelefone(tel?: string): string {
  if (!tel) return ''
  const d = tel.replace(/\D/g, '')
  // Adiciona 55 (BR) se não tiver código de país
  return d.length === 10 || d.length === 11 ? `55${d}` : d
}

/** Pega o melhor telefone do cliente: o do contato principal, ou o primeiro contato com telefone. */
function pegarTelefoneCliente(cliente: any): string {
  if (!cliente) return ''
  const contatos = cliente.contatos || []
  const principal = contatos.find((c: any) => c.principal && c.telefone)
  if (principal) return principal.telefone
  const qq = contatos.find((c: any) => c.telefone)
  if (qq) return qq.telefone
  return cliente.telefone || ''
}

async function enviarWhatsAppLancamento(l: any) {
  const telRaw = pegarTelefoneCliente(l.cliente)
  const tel = limparTelefone(telRaw)
  if (!tel) {
    alert('Cliente sem telefone/WhatsApp cadastrado.\n\nCadastre um contato com telefone em Clientes.')
    return
  }

  // Pega o mesmo texto que vai no e-mail (consistência)
  let texto = ''
  try {
    const r = await api.post(`/email/lancamentos/${l.id}/preview`)
    texto = r.data.texto || ''
  } catch {
    // Fallback simples caso o preview falhe
    const venc = fmtDate(l.dtVencimento)
    const valor = fmt(Number(l.valor))
    const numero = l.numeroFatura || ''
    texto = `Olá! Segue a sua fatura ${numero} no valor de ${valor} com vencimento em ${venc}.\n\nAlfer Equipamentos\n📞 0800 620 0050 / (81) 9 7109-4000`
  }

  // Baixa fatura e (se tiver) boleto pra usuária anexar manualmente
  const querBaixarAnexos = confirm(
    'Vou abrir o WhatsApp com a mensagem pronta.\n\n' +
    'Quer também baixar a fatura' + (l.interCodigoSolicitacao ? ' e o boleto' : '') + ' pra você anexar no WhatsApp Web?\n\n' +
    'OK = baixa os PDFs\nCancelar = só abre o WhatsApp'
  )

  if (querBaixarAnexos) {
    try { await abrirFaturaPdf(l.id) } catch {}
    if (l.interCodigoSolicitacao) {
      try { await abrirBoletoInter(l) } catch {}
    }
  }

  const msg = encodeURIComponent(texto)
  window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
}

export function Financeiro() {
  const [dash, setDash] = useState<any>(null)
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [erroAcao, setErroAcao] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'' | 'RECEITA' | 'DESPESA'>('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroEmissor, setFiltroEmissor] = useState('')
  const [novaDespesaModal, setNovaDespesaModal] = useState(false)
  const [enviarEmailModal, setEnviarEmailModal] = useState<any>(null)
  // Modal de troca de emissor da fatura
  const [emissorModal, setEmissorModal] = useState<any>(null)
  const [emissoresList, setEmissoresList] = useState<any[]>([])

  const carregar = () => {
    const params: any = {}
    if (filtroTipo) params.tipo = filtroTipo
    if (filtroStatus) params.status = filtroStatus
    if (filtroEmissor) params.emissorId = filtroEmissor
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
  }, [filtroTipo, filtroStatus, filtroEmissor])

  // Carrega lista de emissores uma vez (pro select do filtro)
  useEffect(() => {
    api.get('/emissores', { params: { ativo: 'true' } })
      .then((r) => setEmissoresList((r.data || []).filter((e: any) => e.ativo)))
      .catch(() => {})
  }, [])

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

  // Abre o modal pra trocar emissor de uma fatura. Só permitido se não PAGO.
  const abrirModalEmissor = async (l: any) => {
    if (l.status === 'PAGO') return
    setErroAcao('')
    // Lazy-load emissores
    if (emissoresList.length === 0) {
      try {
        const r = await api.get('/emissores', { params: { ativo: 'true' } })
        setEmissoresList((r.data || []).filter((e: any) => e.ativo))
      } catch {}
    }
    const atual =
      l.emissor?.id ||
      l.contrato?.emissor?.id ||
      null
    setEmissorModal({ lanc: l, emissorId: atual })
  }

  const salvarTrocaEmissor = async () => {
    if (!emissorModal) return
    const { lanc, emissorId } = emissorModal
    setErroAcao('')
    try {
      await api.put(`/financeiro/lancamentos/${lanc.id}/emissor`, { emissorId })
      // Se já tinha número de fatura, oferece renumerar pra usar a faixa do novo emissor
      const podeRenumerar = lanc.status !== 'PAGO' && lanc.status !== 'CANCELADO' && lanc.numeroFatura
      let renumerou = false
      if (podeRenumerar) {
        const novoEmissor = emissoresList.find((e) => e.id === emissorId)
        const faixa = novoEmissor?.faturaInicio || '?'
        if (confirm(
          `Emissor atualizado. A fatura está numerada como NF ${lanc.numeroFatura}.\n\n` +
          `Quer renumerar pra usar a faixa do emissor "${novoEmissor?.nomeFantasia || novoEmissor?.razaoSocial}" (${faixa}+)?\n\n` +
          `O próximo PDF vai pegar o próximo número disponível.`
        )) {
          await api.post(`/financeiro/lancamentos/${lanc.id}/renumerar`)
          renumerou = true
        }
      }
      setEmissorModal(null)
      await carregar()
      if (renumerou) alert('Fatura renumerada. Gere o PDF de novo pra atribuir o novo número.')
    } catch (e: any) {
      setErroAcao(e.response?.data?.message || 'Erro ao trocar emissor')
    }
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
    PAGO: '#27AE60', PENDENTE: '#FFAF06', FUTURO: '#2D80D1', VENCIDO: '#713F12', INADIMPLENTE: '#713F12', CANCELADO: '#fff',
  }
  const statusBg: Record<string, string> = {
    PAGO: '#EAF3DE', PENDENTE: '#FEF3E2', FUTURO: '#E3EEFA', VENCIDO: '#FEF08A', INADIMPLENTE: '#FEF08A', CANCELADO: '#DC2626',
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
        {/* Filtro de emissor (separar Alfer / Albuquerque) */}
        {emissoresList.length > 1 && (
          <select
            value={filtroEmissor}
            onChange={(e) => setFiltroEmissor(e.target.value)}
            className="px-3 py-2 bg-white rounded-xl text-sm outline-none"
            style={{
              border: '1px solid #E0DDD8',
              ...(filtroEmissor && { background: '#FEF3E2', color: '#633806', fontWeight: 500 }),
            }}
            title="Filtrar lançamentos por CNPJ emissor"
          >
            <option value="">Todos os emissores</option>
            {emissoresList.map((em) => (
              <option key={em.id} value={em.id}>
                {em.nomeFantasia || abreviarEmissor(em.razaoSocial)}{em.padrao ? ' (padrão)' : ''}
              </option>
            ))}
          </select>
        )}
        <span className="text-xs text-gray-500 ml-auto">{lancamentos.length} lançamento(s)</span>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="divide-y divide-gray-50">
          {lancamentos.map((l, idx) => {
            const catLabel = l.categoria ? CATEGORIAS.find((c) => c.v === l.categoria)?.l : null
            // Zebra discreta: alterna branco / creme muito sutil (#FBFAF7 — paleta
            // quente do sistema) só pra dar respiro visual entre lançamentos.
            const fundoAlternado = idx % 2 === 1 ? '#FBFAF7' : '#fff'
            return (
              <div key={l.id} className="px-5 py-4" style={{ background: fundoAlternado }}>
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
                      {l.tipo === 'RECEITA' && (l.emissor || l.contrato?.emissor) && (() => {
                        // Override por lançamento tem prioridade sobre o do contrato.
                        const em = l.emissor || l.contrato?.emissor
                        const podeEditar = l.status !== 'PAGO'
                        return (
                          <button
                            type="button"
                            onClick={podeEditar ? () => abrirModalEmissor(l) : undefined}
                            disabled={!podeEditar}
                            className={`text-[10px] px-1.5 py-0.5 rounded-full transition ${podeEditar ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                            style={{
                              background: em.padrao ? '#F1EFE8' : '#FEF3E2',
                              color: em.padrao ? '#888' : '#633806',
                            }}
                            title={podeEditar
                              ? `${em.razaoSocial} — clique pra trocar`
                              : em.razaoSocial}
                          >
                            {em.nomeFantasia || abreviarEmissor(em.razaoSocial)}
                            {l.emissor && <span style={{ marginLeft: 3, opacity: 0.6 }}>•</span>}
                          </button>
                        )
                      })()}
                      {l.recebimentoConfirmadoEm && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-1"
                          style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' }}
                          title={`Recebimento confirmado pelo cliente em ${new Date(l.recebimentoConfirmadoEm).toLocaleString('pt-BR')}`}
                        >
                          ✓ Confirmado
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
                    {l.tipo === 'RECEITA' && (
                      <button
                        onClick={() => enviarWhatsAppLancamento(l)}
                        title="Abrir WhatsApp Web com a mensagem pronta (anexos manuais)"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{
                          background: '#EAF7E6',
                          color: '#075E54',
                          border: '1px solid #B7E0AE',
                        }}
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
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

      {/* Modal de troca de emissor (Multi-CNPJ) */}
      {emissorModal && (
        <Modal onClose={() => setEmissorModal(null)} maxWidth="max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5" style={{ color: '#FFAF06' }} />
              Trocar emissor da fatura
            </h2>
            <button type="button" onClick={() => setEmissorModal(null)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="text-xs text-gray-500 mb-4">
            Define em nome de qual CNPJ esta fatura será emitida (override sobre o emissor do contrato).
            {emissorModal.lanc.numeroFatura && (
              <> Esta fatura tem o número <b>NF {emissorModal.lanc.numeroFatura}</b> — vou perguntar se você quer renumerar depois.</>
            )}
          </div>

          {emissoresList.length === 0 ? (
            <div className="text-sm text-gray-500 italic mb-4">Carregando emissores…</div>
          ) : (
            <div className="space-y-2 mb-4">
              {emissoresList.map((em) => {
                const sel = emissorModal.emissorId === em.id
                return (
                  <label
                    key={em.id}
                    className="flex items-start gap-3 rounded-xl p-3 cursor-pointer transition"
                    style={{
                      border: sel ? '1px solid #FFAF06' : '1px solid #E0DDD8',
                      background: sel ? '#FEF3E2' : '#fff',
                    }}
                  >
                    <input
                      type="radio"
                      name="emissor-troca"
                      className="mt-1"
                      checked={sel}
                      onChange={() => setEmissorModal({ ...emissorModal, emissorId: em.id })}
                      style={{ accentColor: '#FFAF06' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{em.razaoSocial}</span>
                        {em.padrao && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1"
                                style={{ background: '#FEF3E2', color: '#633806' }}>
                            <Star className="w-2.5 h-2.5 fill-current" /> Padrão
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        CNPJ {em.cnpj} · Fatura {em.faturaInicio}+
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          {erroAcao && (
            <div className="p-3 mb-3 rounded-xl text-red-700 text-sm flex items-center gap-2"
                 style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erroAcao}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEmissorModal(null)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              style={{ border: '1px solid #E0DDD8' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvarTrocaEmissor}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900"
              style={{ background: '#FFAF06' }}
            >
              Salvar
            </button>
          </div>
        </Modal>
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
  // Anexos extras enviados pelo usuário (boleto manual etc.)
  const [anexosExtras, setAnexosExtras] = useState<{ filename: string; content: string; contentType: string; size: number }[]>([])

  useEffect(() => {
    setLoading(true)
    api.post(`/email/lancamentos/${lancamento.id}/preview`)
      .then((r) => {
        setPreview(r.data)
        setForm((f) => ({
          ...f,
          destinatario: r.data.destinatarioSugerido || '',
          cc: r.data.ccSugerido || '',
          assunto: r.data.assunto || '',
          corpo: r.data.texto || '',
        }))
      })
      .catch((e) => setErro(e.response?.data?.message || 'Erro ao carregar preview'))
      .finally(() => setLoading(false))
  }, [lancamento.id])

  const onPickAnexos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const novos: typeof anexosExtras = []
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        setErro(`Arquivo "${f.name}" excede 10MB (limite por anexo).`)
        continue
      }
      const buf = await f.arrayBuffer()
      const content = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''))
      novos.push({ filename: f.name, content, contentType: f.type || 'application/octet-stream', size: f.size })
    }
    setAnexosExtras((prev) => [...prev, ...novos])
    e.target.value = '' // reseta pra permitir re-selecionar mesmo arquivo
  }

  const removerAnexo = (idx: number) => setAnexosExtras((prev) => prev.filter((_, i) => i !== idx))

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.destinatario || !/.+@.+/.test(form.destinatario)) return setErro('E-mail destinatário inválido')
    setEnviando(true); setErro('')
    try {
      const r = await api.post(`/email/lancamentos/${lancamento.id}/enviar`, {
        ...form,
        anexosExtras: anexosExtras.map(({ filename, content, contentType }) => ({ filename, content, contentType })),
      })
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
            <p className="text-xs text-gray-500">⚠ Sem boleto Inter emitido. Use "+ Anexar arquivo" abaixo pra incluir um boleto manual ou comprovante.</p>
          )}
          {/* Anexos extras enviados pelo usuário (boleto manual etc.) */}
          {anexosExtras.length > 0 && (
            <div className="space-y-1 pt-1">
              {anexosExtras.map((a, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs bg-white px-2.5 py-1.5 rounded-lg" style={{ border: '1px solid #E0DDD8' }}>
                  <FileDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="flex-1 truncate">{a.filename}</span>
                  <span className="text-gray-400 flex-shrink-0">{(a.size / 1024).toFixed(0)} KB</span>
                  <button type="button" onClick={() => removerAnexo(idx)} className="text-red-500 hover:text-red-700 flex-shrink-0" title="Remover">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white transition" style={{ border: '1px solid #E0DDD8', color: '#633806' }}>
            <Plus className="w-3.5 h-3.5" />
            Anexar arquivo (boleto, comprovante, etc.)
            <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={onPickAnexos} />
          </label>
          <p className="text-[10px] text-gray-400">Aceita PDF/PNG/JPG, até 10MB por arquivo.</p>
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
