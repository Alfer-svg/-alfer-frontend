import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, FileText, Package, DollarSign, Calendar, AlertCircle, Loader2, RotateCw, X, Building2, Bell, Pencil, Trash2 } from 'lucide-react'

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
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

export default function ContratoDetalhe() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [c, setC] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showRenovar, setShowRenovar] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    api.get(`/contratos/${id}`).then((r) => setC(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [id])

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
        <div className="flex gap-2">
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
          {c.status !== 'ENCERRADO' && c.status !== 'RESCINDIDO' && (
            <>
              <button onClick={() => mudarStatus('ENCERRADO')} disabled={updatingStatus} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700" style={{ background: '#F1EFE8' }}>Encerrar</button>
              <button onClick={() => { if (confirm('Rescindir contrato? Aplicação de multa pode ser necessária.')) mudarStatus('RESCINDIDO') }} disabled={updatingStatus} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#FDEEEE', color: '#8B0000' }}>Rescindir</button>
            </>
          )}
        </div>
      </div>

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
              <div
                key={ce.id}
                onClick={() => navigate(`/equipamentos/${ce.equipamento.id}`)}
                className="p-3 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-3"
                style={{ background: '#F9F7F4' }}
              >
                <Package className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{ce.equipamento.codigo}</div>
                  <div className="text-xs text-gray-500">{ce.equipamento.modelo} • {ce.equipamento.capacidade}</div>
                </div>
                <span className="text-xs text-gray-400">{tipoLabel[ce.equipamento.tipo] || ce.equipamento.tipo}</span>
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
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  )
}
