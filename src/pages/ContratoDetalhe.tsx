import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { ArrowLeft, FileText, Package, DollarSign, Calendar, AlertCircle, Loader2, RotateCw, X, Building2, Bell, Pencil, Trash2, ClipboardList, FileDown, Send, Mail, CheckCircle2, XCircle, RefreshCw, Plus, Copy, Clock, MapPin, ArrowLeftRight, Search } from 'lucide-react'
import { fmtDate } from '../utils/data'

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  ATIVO: { bg: '#EAF3DE', text: '#27500A', label: 'Ativo' },
  VENCENDO: { bg: '#FEF3E2', text: '#633806', label: 'Vencendo' },
  RASCUNHO: { bg: '#F1EFE8', text: '#888', label: 'Rascunho' },
  AGUARDANDO_ASSINATURA: { bg: '#E3EEFA', text: '#1A5276', label: 'Aguard. assinatura' },
  ENCERRADO: { bg: '#F1EFE8', text: '#888', label: 'Encerrado' },
  RESCINDIDO: { bg: '#FDEEEE', text: '#8B0000', label: 'Rescindido' },
}

const tipoLabel: Record<string, string> = {
  CONTAINER_SECO: 'Container Seco',
  CONTAINER_REEFER: 'Container Reefer',
  CACAMBA_ESTACIONARIA: 'Caçamba Estacionária',
  CAMINHAO_MUNCK: 'Caminhão Munck',
  CAMINHAO_POLIGUINDASTE: 'Caminhão Poliguindaste',
  CAMINHAO_CAVALO_MECANICO: 'Caminhão Cavalo Mecânico',
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function ContratoDetalhe() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [c, setC] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showRenovar, setShowRenovar] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const [baixandoPdf, setBaixandoPdf] = useState(false)
  const [signStatus, setSignStatus] = useState<any>(null)
  const [showSignModal, setShowSignModal] = useState(false)
  const [erroSign, setErroSign] = useState('')
  // Diagnóstico automático de faturas (banner amarelo se algo tá errado)
  const [diagFaturas, setDiagFaturas] = useState<{ temFaturas: boolean; motivo: string | null; acao: string | null } | null>(null)
  const [substituirEquip, setSubstituirEquip] = useState<any>(null)

  const load = () => {
    if (!id) return
    setLoading(true)
    api.get(`/contratos/${id}`).then((r) => setC(r.data)).finally(() => setLoading(false))
    api.get(`/contratos/${id}/status-assinatura`).then((r) => setSignStatus(r.data)).catch(() => {})
    api.get(`/contratos/${id}/diagnostico-faturas`).then((r) => setDiagFaturas(r.data)).catch(() => setDiagFaturas(null))
  }
  useEffect(load, [id])

  const sincronizar = async () => {
    if (!id) return
    try {
      await api.post(`/contratos/${id}/sincronizar-assinatura`)
      load()
    } catch (e: any) {
      setErroSign(e.response?.data?.message || 'Erro ao sincronizar')
    }
  }
  const cancelarAssinatura = async () => {
    if (!id) return
    if (!confirm('Cancelar o envio pra assinatura? O cliente perderá o link. Você pode reenviar depois.')) return
    try {
      await api.post(`/contratos/${id}/cancelar-assinatura`)
      load()
    } catch (e: any) {
      setErroSign(e.response?.data?.message || 'Erro ao cancelar')
    }
  }
  const baixarAssinado = async () => {
    if (!id) return
    try {
      const r = await api.get(`/contratos/${id}/pdf-assinado`, { responseType: 'blob' })
      const blob = new Blob([r.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (e: any) {
      setErroSign(e.response?.data?.message || 'PDF assinado ainda não disponível')
    }
  }

  const recalcularFaturas = async () => {
    if (!id) return
    if (!confirm('Recalcular as faturas deste contrato?\n\nAs faturas com status FUTURO ou PENDENTE (não pagas) serão APAGADAS e reggeradas com base na condição de pagamento atual.\n\nFaturas já PAGAS ou CANCELADAS não são afetadas.')) return
    try {
      const r = await api.post(`/contratos/${id}/recalcular-faturas`)
      // Se gerou zero, mostra o motivo retornado pelo backend (diagnóstico).
      if ((r.data?.geradas || 0) === 0 && r.data?.mensagem) {
        alert(`⚠ Nenhuma fatura foi gerada.\n\nMotivo: ${r.data.mensagem}`)
      } else {
        alert(`✓ ${r.data?.geradas || 0} fatura(s) gerada(s) com a regra atual.`)
      }
      load()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao recalcular')
    }
  }

  const baixarPdf = async () => {
    if (!id) return
    setBaixandoPdf(true)
    try {
      const r = await api.get(`/contratos/${id}/pdf`, { responseType: 'blob' })
      const blob = new Blob([r.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      // libera memória depois (URL tá aberto na aba)
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao gerar PDF')
    } finally {
      setBaixandoPdf(false)
    }
  }

  const mudarStatus = async (status: string) => {
    setUpdatingStatus(true)
    try {
      await api.put(`/contratos/${id}/status`, { status })
      load()
    } finally {
      setUpdatingStatus(false)
    }
  }

  const [erroExcluir, setErroExcluir] = useState('')
  const excluir = async () => {
    if (!confirm('Excluir este contrato? Esta ação não pode ser desfeita.')) return
    if (!confirm('Confirma de novo? Se houver pedido, renovações ou lançamentos, a exclusão será bloqueada.')) return
    setErroExcluir('')
    try {
      await api.delete(`/contratos/${id}`)
      navigate('/contratos')
    } catch (err: any) {
      setErroExcluir(err.response?.data?.message || 'Erro ao excluir contrato.')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!c) return <div className="p-8 text-gray-400">Contrato não encontrado.</div>

  const status = statusColor[c.status] || statusColor.ATIVO
  const diasVenc = Math.ceil((new Date(c.dtFim).getTime() - Date.now()) / 86400000)

  return (
    <div className="p-8 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/contratos')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm transition-all">
          <ArrowLeft className="w-4 h-4" /> Voltar para contratos
        </button>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={baixarPdf}
            disabled={baixandoPdf}
            title="Gera o PDF do contrato adaptado ao tipo de equipamento"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: '#2D80D1' }}
          >
            {baixandoPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
            Gerar PDF do contrato
          </button>
          {(!signStatus?.signStatus || signStatus?.signStatus === 'RECUSADO' || signStatus?.signStatus === 'EXPIRADO') && (
            <button
              onClick={() => { setErroSign(''); setShowSignModal(true) }}
              title="Envia o contrato pra assinatura eletrônica via ZapSign"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: '#9333EA' }}
            >
              <Send className="w-3 h-3" /> Enviar pra assinatura
            </button>
          )}
          {/* Upload manual do PDF assinado (Adobe Pro, papel + scan etc.) */}
          {signStatus?.signStatus !== 'ASSINADO' && (
            <label
              title="Já assinou em outra ferramenta (Adobe Pro, DocuSign, papel/scan)? Faz upload aqui."
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-900 cursor-pointer"
              style={{ background: '#FFAF06' }}
            >
              <FileDown className="w-3 h-3 rotate-180" /> Upload PDF assinado
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={async (ev) => {
                  const file = ev.target.files?.[0]
                  if (!file) return
                  if (file.size > 20 * 1024 * 1024) {
                    setErroSign('PDF excede 20MB')
                    ev.target.value = ''
                    return
                  }
                  if (!confirm(`Confirma upload de "${file.name}" como contrato assinado?\nO contrato será marcado como ASSINADO.`)) {
                    ev.target.value = ''
                    return
                  }
                  setErroSign('')
                  try {
                    const buf = await file.arrayBuffer()
                    const pdfBase64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''))
                    await api.post(`/contratos/${id}/upload-pdf-assinado`, { pdfBase64 })
                    load()
                  } catch (e: any) {
                    setErroSign(e.response?.data?.message || 'Erro ao fazer upload')
                  }
                  ev.target.value = ''
                }}
              />
            </label>
          )}
          {c?.tipoModelo === 'CAMINHAO_MUNCK' && (
            <button
              onClick={() => navigate(`/ordens-servico/munck/nova?contratoId=${id}`)}
              title="Gera uma OS Munck pré-preenchida com os dados deste contrato"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: '#27AE60' }}
            >
              <ClipboardList className="w-3 h-3" /> Gerar OS Munck
            </button>
          )}
          <button
            onClick={recalcularFaturas}
            title="Apaga as faturas não pagas e refaz com base na condição de pagamento atual"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
            style={{ border: '1px solid #E0DDD8' }}
          >
            <RotateCw className="w-3 h-3" /> Recalcular faturas
          </button>
          <button
            onClick={() => navigate(`/contratos/${id}/editar`)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
            style={{ border: '1px solid #E0DDD8' }}
          >
            <Pencil className="w-3 h-3" /> Editar
          </button>
          <button
            onClick={excluir}
            title="Excluir contrato (bloqueado se houver pedido, renovações ou lançamentos)"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50"
            style={{ border: '1px solid #FACACA' }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {erroExcluir && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erroExcluir}
        </div>
      )}
      {erroSign && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erroSign}
        </div>
      )}
      {/* Banner amarelo: contrato sem faturas — mostra motivo + ação direto */}
      {diagFaturas && !diagFaturas.temFaturas && diagFaturas.motivo && (
        <div className="p-4 mb-4 rounded-xl flex items-start gap-3" style={{ background: '#FFF8E6', border: '1px solid #FFD577' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FFAF06' }} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm" style={{ color: '#633806' }}>Este contrato ainda não tem faturas</div>
            <div className="text-sm mt-1" style={{ color: '#633806' }}>{diagFaturas.motivo}</div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {diagFaturas.acao === 'ativar' && c.status !== 'ATIVO' && (
              <button
                onClick={() => mudarStatus('ATIVO')}
                disabled={updatingStatus}
                className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                style={{ background: '#27AE60', color: 'white' }}
              >
                Ativar agora
              </button>
            )}
            {diagFaturas.acao === 'recalcular' && (
              <button
                onClick={recalcularFaturas}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-900"
                style={{ background: '#FFAF06' }}
              >
                Gerar faturas
              </button>
            )}
            {diagFaturas.acao === 'corrigir' && (
              <button
                onClick={() => navigate(`/contratos/${id}/editar`)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-900"
                style={{ background: '#FFAF06' }}
              >
                Editar contrato
              </button>
            )}
          </div>
        </div>
      )}
      {signStatus?.signStatus && (
        <SignStatusCard
          status={signStatus}
          onSincronizar={sincronizar}
          onCancelar={cancelarAssinatura}
          onBaixarAssinado={baixarAssinado}
        />
      )}
      {showSignModal && c && (
        <EnviarAssinaturaModal
          contrato={c}
          onClose={() => setShowSignModal(false)}
          onSent={() => { setShowSignModal(false); load() }}
          onError={(m) => setErroSign(m)}
        />
      )}

      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
            <FileText className="w-7 h-7" style={{ color: '#FFAF06' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-gray-900">{c.numero}</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: status.bg, color: status.text }}>
                {status.label}
              </span>
              {diasVenc <= 30 && diasVenc > 0 && (
                <span className="flex items-center gap-1 text-xs text-orange-600">
                  <AlertCircle className="w-3 h-3" /> {diasVenc} dias restantes
                </span>
              )}
              {diasVenc < 0 && c.status !== 'ENCERRADO' && c.status !== 'RESCINDIDO' && (
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" /> Vencido há {Math.abs(diasVenc)} dias
                </span>
              )}
            </div>
            <p className="text-gray-700 mt-1">{c.cliente?.razaoSocial}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 flex-wrap">
              <span>{tipoLabel[c.tipoModelo] || c.tipoModelo}</span>
              <span>{fmtDate(c.dtInicio)} → {fmtDate(c.dtFim)}</span>
              <span className="font-medium text-gray-700">{fmt(Number(c.valor))} / {c.periodicidade}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap pt-4 border-t" style={{ borderColor: '#F1EFE8' }}>
          {c.status !== 'ATIVO' && (<button onClick={() => mudarStatus('ATIVO')} disabled={updatingStatus} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50" style={{ background: '#EAF3DE', color: '#27500A' }}>Ativar</button>)}
          {c.status === 'ATIVO' && (<button onClick={() => setShowRenovar(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-900" style={{ background: '#FFAF06' }}><RotateCw className="w-3 h-3" /> Renovar</button>)}
          {c.lancamentos?.length === 0 && (
            <button
              onClick={async () => {
                try {
                  const r = await api.post(`/contratos/${id}/gerar-faturas`)
                  alert(r.data?.mensagem || `✓ ${r.data?.geradas || 0} fatura(s) gerada(s)`)
                  load()
                } catch (err: any) {
                  alert(err.response?.data?.message || 'Erro ao gerar faturas.')
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-900"
              style={{ background: '#FFF8E6', color: '#FFAF06' }}
            >
              <DollarSign className="w-3 h-3" /> Gerar faturas
            </button>
          )}
          {c.status !== 'ENCERRADO' && c.status !== 'RESCINDIDO' && (
            <>
              <button onClick={() => mudarStatus('ENCERRADO')} disabled={updatingStatus} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700" style={{ background: '#F1EFE8' }}>Encerrar</button>
              <button onClick={() => { if (confirm('Rescindir contrato? Aplicação de multa pode ser necessária.')) mudarStatus('RESCINDIDO') }} disabled={updatingStatus} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#FDEEEE', color: '#8B0000' }}>Rescindir</button>
            </>
          )}
        </div>
      </div>

      {c.localMobilizacao && (
        <div className="bg-white rounded-2xl p-5 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" style={{ color: '#FFAF06' }} /> Local de mobilização
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.localMobilizacao}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Cliente</h2>
          <p className="text-sm font-medium text-gray-700">{c.cliente?.razaoSocial}</p>
          <p className="text-xs text-gray-400">{c.cliente?.cnpj}</p>
          {c.cliente?.contatos?.length > 0 && (
            <div className="mt-3 space-y-1">
              {c.cliente.contatos.slice(0, 2).map((ct: any) => (
                <div key={ct.id} className="text-xs text-gray-500">
                  <span className="font-medium">{ct.nome}</span> {ct.telefone && `• ${ct.telefone}`}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Cobrança</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Forma:</span><span className="font-medium text-gray-700">{c.formaCobranca}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Vencimento:</span><span className="font-medium text-gray-700">dia {c.diaVencFatura}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Reajuste:</span><span className="font-medium text-gray-700">{c.reajuste}</span></div>
            {c.multaRescisaoPct && <div className="flex justify-between"><span className="text-gray-500">Multa rescisão:</span><span className="font-medium text-gray-700">{c.multaRescisaoPct}%</span></div>}
          </div>
        </div>
      </div>

      {c.equipamentos?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> Equipamentos vinculados ({c.equipamentos.length})</h2>
          <div className="space-y-2">
            {c.equipamentos.map((ce: any) => (
              <div key={ce.id} className="p-3 rounded-lg flex items-center gap-3" style={{ background: '#F9F7F4' }}>
                <Package
                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => navigate(`/equipamentos/${ce.equipamento.id}`)}
                />
                <div className="flex-1 cursor-pointer" onClick={() => navigate(`/equipamentos/${ce.equipamento.id}`)}>
                  <div className="text-sm font-semibold text-gray-900">{ce.equipamento.codigo}</div>
                  <div className="text-xs text-gray-500">{ce.equipamento.modelo} • {ce.equipamento.capacidade}</div>
                </div>
                <span className="text-xs text-gray-400">{tipoLabel[ce.equipamento.tipo] || ce.equipamento.tipo}</span>
                {!['ENCERRADO', 'RESCINDIDO'].includes(c.status) && (
                  <button
                    onClick={() => setSubstituirEquip(ce)}
                    className="text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1"
                    style={{ background: '#FEF3E2', color: '#7B5B0F' }}
                    title="Substituir esse equipamento por outro"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    Substituir
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {c.alertas?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Bell className="w-4 h-4" /> Alertas de vencimento</h2>
          <div className="flex gap-2 flex-wrap">
            {c.alertas.map((a: any) => (
              <span key={a.id} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#FFF8E6', color: '#633806' }}>
                {a.diasAntes} dias antes
              </span>
            ))}
          </div>
        </div>
      )}

      {c.lancamentos?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Últimos lançamentos</h2>
          <div className="space-y-2">
            {c.lancamentos.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0" style={{ borderColor: '#F1EFE8' }}>
                <div>
                  <div className="font-medium text-gray-700">{l.descricao}</div>
                  <div className="text-xs text-gray-400">Vence: {fmtDate(l.dtVencimento)}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold" style={{ color: l.status === 'PAGO' ? '#27AE60' : '#FFAF06' }}>{fmt(Number(l.valor))}</div>
                  <div className="text-xs text-gray-400">{l.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {c.renovacoes?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Histórico de renovações</h2>
          <div className="space-y-2">
            {c.renovacoes.map((r: any) => (
              <div key={r.id} className="p-3 rounded-lg text-sm" style={{ background: '#F9F7F4' }}>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Renovado em {fmtDate(r.dtRenovacao)} até {fmtDate(r.novaDtFim)}</span>
                  <span className="font-semibold text-gray-900">{fmt(Number(r.novoValor))}</span>
                </div>
                {r.observacoes && <p className="text-xs text-gray-500 mt-1">{r.observacoes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {c.observacoes && (
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-2">Observações</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.observacoes}</p>
        </div>
      )}

      {showRenovar && <RenovarModal contrato={c} onClose={() => setShowRenovar(false)} onSuccess={() => { setShowRenovar(false); load() }} />}
      {substituirEquip && (
        <SubstituirEquipamentoModal
          contratoId={c.id}
          equipAtual={substituirEquip}
          onClose={() => setSubstituirEquip(null)}
          onSuccess={() => { setSubstituirEquip(null); load() }}
        />
      )}
    </div>
  )
}

function SubstituirEquipamentoModal({
  contratoId, equipAtual, onClose, onSuccess,
}: { contratoId: string; equipAtual: any; onClose: () => void; onSuccess: () => void }) {
  const [busca, setBusca] = useState('')
  const [todos, setTodos] = useState<any[]>([])
  const [escolhido, setEscolhido] = useState<any>(null)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [carregandoLista, setCarregandoLista] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.get('/equipamentos')
      .then((r) => {
        // Filtra: mesmo tipo do antigo + DISPONIVEL (sem contratos vivos) + diferente do antigo
        const filt = (r.data || []).filter((e: any) =>
          e.id !== equipAtual.equipamento.id
          && e.tipo === equipAtual.equipamento.tipo
          && (!e.contratosEquip || e.contratosEquip.length === 0)
        )
        setTodos(filt)
      })
      .catch(() => setErro('Erro ao carregar equipamentos'))
      .finally(() => setCarregandoLista(false))
  }, [])

  const filtrados = busca
    ? todos.filter((e) =>
        e.codigo?.toLowerCase().includes(busca.toLowerCase())
        || e.modelo?.toLowerCase().includes(busca.toLowerCase())
        || e.capacidade?.toLowerCase().includes(busca.toLowerCase())
      )
    : todos

  const submeter = async () => {
    if (!escolhido) return setErro('Escolhe o equipamento novo')
    setLoading(true)
    setErro('')
    try {
      const r = await api.post(`/contratos/${contratoId}/substituir-equipamento`, {
        equipamentoAntigoId: equipAtual.equipamento.id,
        equipamentoNovoId: escolhido.id,
        motivo: motivo.trim() || null,
      })
      alert(r.data?.mensagem || 'Equipamento substituído')
      onSuccess()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao substituir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <ArrowLeftRight className="w-5 h-5" /> Substituir equipamento
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Saindo: <strong>{equipAtual.equipamento.codigo}</strong> — {equipAtual.equipamento.modelo}
      </p>

      <div className="mb-3">
        <label className="block text-xs font-bold text-gray-600 mb-1">Buscar equipamento de substituição</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Código, modelo, capacidade..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white outline-none"
            style={{ border: '1px solid #E0DDD8' }}
            autoFocus
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto mb-3 border rounded-lg" style={{ borderColor: '#E0DDD8' }}>
        {carregandoLista ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Carregando...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            Nenhum equipamento disponível do mesmo tipo
          </div>
        ) : (
          filtrados.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEscolhido(e)}
              className={`w-full text-left p-3 text-sm border-b last:border-0 hover:bg-amber-50 transition-colors ${
                escolhido?.id === e.id ? 'bg-amber-100' : ''
              }`}
              style={{ borderColor: '#F1EFE8' }}
            >
              <div className="font-semibold text-gray-900">{e.codigo}</div>
              <div className="text-xs text-gray-500">{e.modelo} • {e.capacidade || '—'}</div>
            </button>
          ))
        )}
      </div>

      <div className="mb-3">
        <label className="block text-xs font-bold text-gray-600 mb-1">Motivo da substituição (opcional)</label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          placeholder="Ex: equipamento quebrou, foi pra manutenção, cliente solicitou modelo maior..."
          className="w-full px-3 py-2 text-sm rounded-lg bg-white outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        />
      </div>

      {erro && (
        <div className="mb-3 p-2 rounded-lg flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {erro}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-800">
        ⚠️ Ao confirmar: equipamento antigo vai pra <strong>desmobilização</strong>, novo entra em <strong>mobilização</strong>, e fica registrado no histórico do contrato.
      </div>

      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700">
          Cancelar
        </button>
        <button
          onClick={submeter}
          disabled={loading || !escolhido}
          className="flex-1 px-4 py-2 rounded-lg font-bold text-white disabled:opacity-50"
          style={{ background: '#FFAF06', color: '#7B5B0F' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
          Confirmar substituição
        </button>
      </div>
    </Modal>
  )
}

function RenovarModal({ contrato, onClose, onSuccess }: { contrato: any; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const proxData = new Date(contrato.dtFim); proxData.setFullYear(proxData.getFullYear() + 1)
  const [form, setForm] = useState({
    novaDtFim: proxData.toISOString().slice(0, 10),
    novoValor: String(Number(contrato.valor)),
    reajusteAplicado: '',
    observacoes: '',
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.novaDtFim || !form.novoValor) return setErro('Data e valor são obrigatórios.')
    setLoading(true)
    try {
      await api.post(`/contratos/${contrato.id}/renovar`, {
        novaDtFim: form.novaDtFim,
        novoValor: Number(form.novoValor),
        reajusteAplicado: form.reajusteAplicado || null,
        observacoes: form.observacoes || null,
      })
      onSuccess()
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao renovar contrato.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">Renovar contrato</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Contrato atual: {contrato.numero} • Fim: {new Date(contrato.dtFim).toLocaleDateString('pt-BR')}</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nova data de fim *</label>
            <input type="date" value={form.novaDtFim} onChange={(e) => setForm({ ...form, novaDtFim: e.target.value })} required className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Novo valor (R$) *</label>
            <input type="number" step="0.01" min="0" value={form.novoValor} onChange={(e) => setForm({ ...form, novoValor: e.target.value })} required className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Reajuste aplicado</label>
            <input value={form.reajusteAplicado} onChange={(e) => setForm({ ...form, reajusteAplicado: e.target.value })} placeholder="Ex: IPCA 4,5%" className={inputCls} style={inputStyle} />
          </div>
          <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações da renovação..." rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
          {erro && (<div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>)}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar renovação
            </button>
          </div>
        </form>
    </Modal>
  )
}

// ────────── Sign Status Card ──────────
function SignStatusCard({ status, onSincronizar, onCancelar, onBaixarAssinado }: any) {
  const stMap: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    PENDENTE: { bg: '#FFF3D6', text: '#A77400', label: 'Aguardando assinatura', icon: Clock },
    ASSINADO: { bg: '#EAF3DE', text: '#27500A', label: 'Contrato assinado', icon: CheckCircle2 },
    RECUSADO: { bg: '#FDEEEE', text: '#8B0000', label: 'Assinatura recusada', icon: XCircle },
    EXPIRADO: { bg: '#F1EFE8', text: '#666', label: 'Link expirado', icon: XCircle },
  }
  const st = stMap[status.signStatus] || stMap.PENDENTE
  const Icon = st.icon
  return (
    <div className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: st.bg }}>
          <Icon className="w-5 h-5" style={{ color: st.text }} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">{st.label}</div>
          <div className="text-xs text-gray-500">
            via ZapSign
            {status.signDtEnvio ? ` • Enviado em ${new Date(status.signDtEnvio).toLocaleString('pt-BR')}` : ''}
            {status.signDtAssinatura ? ` • Concluído em ${new Date(status.signDtAssinatura).toLocaleString('pt-BR')}` : ''}
          </div>
        </div>
        <div className="flex gap-2">
          {status.signStatus === 'PENDENTE' && (
            <>
              <button onClick={onSincronizar} title="Re-sincronizar com ZapSign" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-gray-50" style={{ border: '1px solid #E0DDD8' }}>
                <RefreshCw className="w-3 h-3" /> Atualizar
              </button>
              <button onClick={onCancelar} title="Cancelar envio" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50" style={{ border: '1px solid #FACACA' }}>
                Cancelar
              </button>
            </>
          )}
          {status.signStatus === 'ASSINADO' && status.temPdfAssinado && (
            <button onClick={onBaixarAssinado} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white" style={{ background: '#27AE60' }}>
              <FileDown className="w-3 h-3" /> Baixar PDF assinado
            </button>
          )}
        </div>
      </div>
      {status.signatarios?.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F1EFE8' }}>
          <div className="text-xs font-medium text-gray-500 mb-2">Signatários</div>
          <div className="space-y-2">
            {status.signatarios.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 text-xs">
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">{s.nome} <span className="text-gray-400 font-normal">({s.tipo})</span></div>
                  <div className="text-gray-500">{s.email}{s.telefone ? ` • ${s.telefone}` : ''}</div>
                </div>
                {s.status === 'ASSINADO' ? (
                  <span className="flex items-center gap-1 text-green-700"><CheckCircle2 className="w-3 h-3" /> Assinou {s.signDtAssinatura ? new Date(s.signDtAssinatura).toLocaleDateString('pt-BR') : ''}</span>
                ) : s.status === 'RECUSADO' ? (
                  <span className="flex items-center gap-1 text-red-700"><XCircle className="w-3 h-3" /> Recusou</span>
                ) : (
                  <>
                    <span className="text-gray-500">Aguardando</span>
                    {s.signLinkAssinatura && (
                      <button onClick={() => { navigator.clipboard.writeText(s.signLinkAssinatura); alert('Link copiado!') }} title="Copiar link de assinatura" className="text-gray-500 hover:text-gray-900">
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ────────── Enviar Assinatura Modal ──────────

function EnviarAssinaturaModal({ contrato, onClose, onSent, onError }: any) {
  // Pré-popula com contato principal do cliente + um campo Alfer
  const [signers, setSigners] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const cliente = contrato.cliente
    const contato = cliente?.contatos?.find((x: any) => x.principal) || cliente?.contatos?.[0]
    const inicial = []
    if (contato?.email) {
      inicial.push({ nome: contato.nome || cliente.razaoSocial, email: contato.email, telefone: contato.telefone || '', tipo: 'LOCATARIO' })
    } else if (cliente) {
      inicial.push({ nome: cliente.razaoSocial, email: '', telefone: '', tipo: 'LOCATARIO' })
    }
    inicial.push({ nome: 'Alfer Equipamentos', email: 'contratos@alferequipamentos.com', telefone: '', tipo: 'LOCADOR' })
    setSigners(inicial)
  }, [contrato])

  const add = () => setSigners([...signers, { nome: '', email: '', telefone: '', tipo: 'TESTEMUNHA' }])
  const rem = (i: number) => setSigners(signers.filter((_, idx) => idx !== i))
  const upd = (i: number, k: string, v: string) => {
    const ns = [...signers]; ns[i] = { ...ns[i], [k]: v }; setSigners(ns)
  }

  const enviar = async () => {
    if (signers.some((s) => !s.nome || !s.email)) {
      onError('Todo signatário precisa de nome e email')
      return
    }
    setLoading(true)
    try {
      await api.post(`/contratos/${contrato.id}/enviar-assinatura`, { signatarios: signers })
      onSent()
    } catch (e: any) {
      onError(e.response?.data?.message || 'Erro ao enviar pra assinatura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <Send className="w-5 h-5" /> Enviar contrato pra assinatura
        </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          O ZapSign envia um email pra cada signatário com link individual de assinatura. Quando todos assinarem, o PDF assinado é arquivado aqui automaticamente.
        </p>
        <div className="space-y-3">
          {signers.map((s, i) => (
            <div key={i} className="p-3 rounded-xl" style={{ background: '#FAFAF8', border: '1px solid #F1EFE8' }}>
              <div className="flex items-center justify-between mb-2">
                <select value={s.tipo} onChange={(e) => upd(i, 'tipo', e.target.value)} className="text-xs px-2 py-1 rounded bg-white outline-none" style={{ border: '1px solid #E0DDD8' }}>
                  <option value="LOCATARIO">Locatário (cliente)</option>
                  <option value="LOCADOR">Locador (Alfer)</option>
                  <option value="TESTEMUNHA">Testemunha</option>
                </select>
                {signers.length > 1 && (
                  <button onClick={() => rem(i)} className="text-xs text-red-600">remover</button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input value={s.nome} onChange={(e) => upd(i, 'nome', e.target.value)} placeholder="Nome completo" className="px-3 py-2 bg-white rounded-lg text-sm outline-none" style={{ border: '1px solid #E0DDD8' }} />
                <input value={s.email} onChange={(e) => upd(i, 'email', e.target.value)} placeholder="Email" type="email" className="px-3 py-2 bg-white rounded-lg text-sm outline-none" style={{ border: '1px solid #E0DDD8' }} />
                <input value={s.telefone} onChange={(e) => upd(i, 'telefone', e.target.value)} placeholder="WhatsApp (opcional, ex: 81999998888)" className="px-3 py-2 bg-white rounded-lg text-sm outline-none md:col-span-2" style={{ border: '1px solid #E0DDD8' }} />
              </div>
            </div>
          ))}
          <button onClick={add} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900">
            <Plus className="w-3 h-3" /> Adicionar signatário
          </button>
        </div>
        <div className="flex gap-2 pt-4 mt-4 border-t" style={{ borderColor: '#F1EFE8' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>
            Cancelar
          </button>
          <button onClick={enviar} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: loading ? '#7E2BC2' : '#9333EA' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Enviar pra assinatura
          </button>
        </div>
    </Modal>
  )
}
