import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, FileText, Building2, Package, AlertCircle, Loader2, Send, CheckCircle2, XCircle, Pencil, Trash2, FileSignature, MessageCircle, Mail, FileDown } from 'lucide-react'

const statusInfo: Record<string, { bg: string; text: string; label: string }> = {
  RASCUNHO: { bg: '#F1EFE8', text: '#888', label: 'Rascunho' },
  ENVIADO: { bg: '#E3EEFA', text: '#1A5276', label: 'Enviado ao cliente' },
  APROVADO: { bg: '#EAF3DE', text: '#27500A', label: 'Aprovado' },
  RECUSADO: { bg: '#FDEEEE', text: '#8B0000', label: 'Recusado' },
  EXPIRADO: { bg: '#F1EFE8', text: '#888', label: 'Expirado' },
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

const condicaoPagamentoLabel = (v?: string) => ({
  A_VISTA: 'À vista',
  D_15: '15 dias',
  D_30: '30 dias',
  D_45: '45 dias',
  D_60: '60 dias',
  PARCELADO_30_60: 'Parcelado 30/60 dias',
  PARCELADO_30_60_90: 'Parcelado 30/60/90 dias',
  PERSONALIZADO: 'Personalizado',
}[v || ''] || v || '—')

const formaPagamentoLabel = (v?: string) => ({
  BOLETO: 'Boleto bancário',
  PIX: 'PIX',
  NF_TED: 'NF + TED',
  TRANSFERENCIA: 'Transferência',
}[v || ''] || v || '—')

export default function OrcamentoDetalhe() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [o, setO] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acao, setAcao] = useState('')
  const [erro, setErro] = useState('')

  const load = () => {
    if (!id) return
    setLoading(true)
    api.get(`/orcamentos/${id}`).then((r) => setO(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [id])

  const enviar = async () => {
    setErro(''); setAcao('enviar')
    try { await api.post(`/orcamentos/${id}/enviar`); load() }
    catch (err: any) { setErro(err.response?.data?.message || 'Erro ao enviar.') }
    finally { setAcao('') }
  }

  const gerarLinkPdf = async (): Promise<string> => {
    const r = await api.post(`/orcamentos/${id}/public-token`)
    const baseUrl = (api.defaults.baseURL || '').replace(/\/$/, '')
    return `${baseUrl}/public/orcamentos/${id}/pdf?token=${r.data.token}`
  }

  const gerarMensagem = (linkPdf?: string) => {
    if (!o) return ''
    const nomeContato = o.cliente?.contatos?.[0]?.nome
    const linhas = [
      `Olá${nomeContato ? `, ${nomeContato.split(' ')[0]}` : ''}!`,
      '',
      `Segue o orçamento *${o.numero}* da Alfer Equipamentos:`,
      '',
      o.descricao && `📋 ${o.descricao}`,
      `💰 Valor: *${fmt(Number(o.valorFinal))}* / ${o.periodicidade.toLowerCase()}`,
      o.desconto && `   (com desconto de ${Number(o.desconto)}%)`,
      `💳 Condição: ${condicaoPagamentoLabel(o.condicaoPagamento)}`,
      `🏦 Forma: ${formaPagamentoLabel(o.formaPagamento)}`,
      o.dtInicio && o.dtFim && `📅 Vigência: ${fmtDate(o.dtInicio)} a ${fmtDate(o.dtFim)}`,
      `⏰ Validade da proposta: ${o.validade} dias`,
      '',
      linkPdf && '📄 Veja o orçamento completo em PDF:',
      linkPdf,
      linkPdf && '',
      'Qualquer dúvida, estamos à disposição!',
      '',
      'Alfer Equipamentos',
    ].filter(Boolean).join('\n')
    return linhas
  }

  const limparTelefone = (tel?: string) => {
    if (!tel) return ''
    const d = tel.replace(/\D/g, '')
    // Adiciona 55 (BR) se não tiver código de país
    return d.length === 10 || d.length === 11 ? `55${d}` : d
  }

  const enviarWhatsApp = async () => {
    const telRaw = o?.cliente?.contatos?.[0]?.telefone
    const tel = limparTelefone(telRaw)
    if (!tel) {
      setErro('Cliente sem telefone cadastrado.')
      return
    }
    let linkPdf = ''
    try { linkPdf = await gerarLinkPdf() } catch { /* segue sem link */ }
    const msg = encodeURIComponent(gerarMensagem(linkPdf))
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
    if (o.status === 'RASCUNHO') {
      try { await api.post(`/orcamentos/${id}/enviar`); load() } catch {}
    }
  }

  const abrirPdf = async () => {
    try {
      const token = localStorage.getItem('alfer_token')
      const baseUrl = (api.defaults.baseURL || '').replace(/\/$/, '')
      const r = await fetch(`${baseUrl}/orcamentos/${id}/pdf?modelo=container`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error('Erro ao gerar PDF')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch (err: any) {
      setErro(err.message || 'Erro ao baixar PDF.')
    }
  }

  const enviarEmail = async () => {
    const email = o?.cliente?.contatos?.[0]?.email
    if (!email) {
      setErro('Cliente sem email cadastrado.')
      return
    }
    let linkPdf = ''
    try { linkPdf = await gerarLinkPdf() } catch { /* segue sem link */ }
    const subject = encodeURIComponent(`Orçamento ${o.numero} — Alfer Equipamentos`)
    const body = encodeURIComponent(gerarMensagem(linkPdf))
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    if (o.status === 'RASCUNHO') {
      try { await api.post(`/orcamentos/${id}/enviar`); load() } catch {}
    }
  }

  const aprovar = async () => {
    if (!confirm('Aprovar este orçamento? Será gerado automaticamente um pedido e um contrato (em rascunho).')) return
    setErro(''); setAcao('aprovar')
    try {
      const r = await api.post(`/orcamentos/${id}/aprovar`)
      navigate(`/pedidos/${r.data.pedido.id}`)
    }
    catch (err: any) { setErro(err.response?.data?.message || 'Erro ao aprovar.') }
    finally { setAcao('') }
  }

  const recusar = async () => {
    const motivo = prompt('Motivo da recusa (opcional):')
    if (motivo === null) return
    setErro(''); setAcao('recusar')
    try { await api.post(`/orcamentos/${id}/recusar`, { motivo }); load() }
    catch (err: any) { setErro(err.response?.data?.message || 'Erro ao recusar.') }
    finally { setAcao('') }
  }

  const excluir = async () => {
    if (!confirm('Excluir este orçamento? Esta ação não pode ser desfeita.')) return
    try {
      await api.delete(`/orcamentos/${id}`)
      navigate('/orcamentos')
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao excluir.')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!o) return <div className="p-8 text-gray-400">Orçamento não encontrado.</div>

  const st = statusInfo[o.status] || statusInfo.RASCUNHO
  const contato = o.cliente?.contatos?.[0]

  return (
    <div className="p-8 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/orcamentos')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm transition-all">
          <ArrowLeft className="w-4 h-4" /> Voltar para orçamentos
        </button>
        <div className="flex gap-2">
          {o.status === 'RASCUNHO' && (
            <>
              <button onClick={() => navigate(`/orcamentos/${id}/editar`)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50" style={{ border: '1px solid #E0DDD8' }}>
                <Pencil className="w-3 h-3" /> Editar
              </button>
              <button onClick={excluir} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50" style={{ border: '1px solid #FACACA' }}>
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
            <FileText className="w-7 h-7" style={{ color: '#FFAF06' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-gray-900">{o.numero}</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.text }}>
                {st.label}
              </span>
            </div>
            <p className="text-gray-700 mt-1">{o.cliente?.razaoSocial}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 flex-wrap">
              <span>Criado: {fmtDate(o.createdAt)}</span>
              {o.dtEnvio && <span>Enviado: {fmtDate(o.dtEnvio)}</span>}
              {o.dtAprovacao && <span>Aprovado: {fmtDate(o.dtAprovacao)}</span>}
              <span>Validade: {o.validade} dias</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-display text-2xl font-bold text-gray-900">{fmt(Number(o.valorFinal))}</div>
            {o.desconto && (
              <div className="text-xs text-gray-400">
                <span className="line-through">{fmt(Number(o.valor))}</span>
                <span className="ml-1 text-green-700">-{Number(o.desconto)}%</span>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">{o.periodicidade}</div>
          </div>
        </div>

        {erro && (<div className="mt-3 p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}><AlertCircle className="w-4 h-4" /> {erro}</div>)}

        <div className="flex gap-2 flex-wrap pt-4 border-t" style={{ borderColor: '#F1EFE8' }}>
          <button
            onClick={abrirPdf}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-900 hover:opacity-90"
            style={{ background: '#F5F0EB', border: '1px solid #E0DDD8' }}
          >
            <FileDown className="w-4 h-4" /> Gerar PDF
          </button>
          {/* Botões de envio direto pro cliente */}
          {(o.status === 'RASCUNHO' || o.status === 'ENVIADO') && (
            <>
              <button
                onClick={enviarWhatsApp}
                title={contato?.telefone ? `Enviar via WhatsApp para ${contato.telefone}` : 'Cliente sem telefone cadastrado'}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
                style={{ background: '#25D366' }}
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button
                onClick={enviarEmail}
                title={contato?.email ? `Enviar por email para ${contato.email}` : 'Cliente sem email cadastrado'}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
                style={{ background: '#2D80D1' }}
              >
                <Mail className="w-4 h-4" /> Email
              </button>
            </>
          )}
          {o.status === 'RASCUNHO' && (
            <button onClick={enviar} disabled={!!acao} className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-900 disabled:opacity-50" style={{ background: '#FFAF06' }}>
              {acao === 'enviar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Marcar como enviado
            </button>
          )}
          {o.status === 'ENVIADO' && (
            <>
              <button onClick={aprovar} disabled={!!acao} className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: '#27AE60' }}>
                {acao === 'aprovar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Aprovar (gera pedido + contrato)
              </button>
              <button onClick={recusar} disabled={!!acao} className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-red-600 disabled:opacity-50" style={{ background: '#FDEEEE' }}>
                {acao === 'recusar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Recusar
              </button>
            </>
          )}
          {o.pedido && (
            <button onClick={() => navigate(`/pedidos/${o.pedido.id}`)} className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: '#EAF3DE', color: '#27500A' }}>
              <FileSignature className="w-4 h-4" /> Ver pedido {o.pedido.numero}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Cliente</h2>
          <p className="text-sm font-medium text-gray-700">{o.cliente?.razaoSocial}</p>
          <p className="text-xs text-gray-400">{o.cliente?.cnpj}</p>
          {contato && (
            <div className="mt-3 text-xs text-gray-500">
              <div className="font-medium">{contato.nome}</div>
              {contato.telefone && <div>{contato.telefone}</div>}
              {contato.email && <div>{contato.email}</div>}
            </div>
          )}
        </div>

        {o.equipamento && (
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> Equipamento</h2>
            <p className="text-sm font-medium text-gray-700">{o.equipamento.codigo} — {o.equipamento.modelo}</p>
            <p className="text-xs text-gray-400">{o.equipamento.capacidade}</p>
          </div>
        )}
      </div>

      {o.descricao && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3">Descrição</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{o.descricao}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold text-gray-900 mb-3">Condições e forma de pagamento</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500 mb-1">Condição</div>
            <div className="font-medium text-gray-700">{condicaoPagamentoLabel(o.condicaoPagamento)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Forma</div>
            <div className="font-medium text-gray-700">{formaPagamentoLabel(o.formaPagamento)}</div>
          </div>
        </div>
      </div>

      {o.condicoes?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3">Condições</h2>
          <ul className="space-y-2">
            {o.condicoes.map((c: string, i: number) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {o.localMobilizacao && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3">Local de mobilização</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{o.localMobilizacao}</p>
        </div>
      )}

      {(o.dtInicio || o.dtFim) && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3">Vigência proposta</h2>
          <p className="text-sm text-gray-700">{fmtDate(o.dtInicio)} → {fmtDate(o.dtFim)}</p>
        </div>
      )}

      {o.observacoes && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3">Observações</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{o.observacoes}</p>
        </div>
      )}
    </div>
  )
}
