import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, FileSignature, Building2, FileText, Loader2, AlertCircle, ChevronRight, MapPin, Trash2 } from 'lucide-react'

const statusInfo: Record<string, { bg: string; text: string; label: string }> = {
  PENDENTE: { bg: '#FEF3E2', text: '#633806', label: 'Pendente' },
  EM_CONTRATO: { bg: '#E3EEFA', text: '#1A5276', label: 'Em contrato' },
  CONCLUIDO: { bg: '#EAF3DE', text: '#27500A', label: 'Concluído' },
  CANCELADO: { bg: '#FDEEEE', text: '#8B0000', label: 'Cancelado' },
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

export default function PedidoDetalhe() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [p, setP] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    api.get(`/pedidos/${id}`).then((r) => setP(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [id])

  const mudarStatus = async (status: string) => {
    setErro(''); setSalvando(true)
    try { await api.put(`/pedidos/${id}/status`, { status }); load() }
    catch (err: any) { setErro(err.response?.data?.message || 'Erro ao alterar status.') }
    finally { setSalvando(false) }
  }

  const excluir = async () => {
    if (!confirm(`Excluir o pedido ${p?.numero}?\n\nIsso vai apagar o pedido + contrato vinculado + faturas não pagas + logística + OS Munck.\n\nFaturas já PAGAS serão preservadas (desvinculadas).\nO orçamento de origem volta pra status ENVIADO.`)) return
    setErro(''); setSalvando(true)
    try {
      await api.delete(`/pedidos/${id}`)
      navigate('/pedidos')
    } catch (err: any) {
      const msg = err.response?.data?.message || ''
      if (/forçar|force|Forçar/i.test(msg)) {
        if (!confirm(`${msg}\n\nFORÇAR a exclusão? Isso vai apagar tudo (incluindo contrato ATIVO se houver). Histórico de faturas PAGAS será preservado.`)) {
          setErro('Exclusão cancelada.')
          setSalvando(false)
          return
        }
        try {
          await api.delete(`/pedidos/${id}?force=true`)
          navigate('/pedidos')
          return
        } catch (e2: any) {
          setErro(e2.response?.data?.message || 'Erro ao forçar exclusão.')
        }
      } else {
        setErro(msg || 'Erro ao excluir pedido.')
      }
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!p) return <div className="p-8 text-gray-400">Pedido não encontrado.</div>

  const st = statusInfo[p.status] || statusInfo.PENDENTE
  const contato = p.cliente?.contatos?.[0]

  return (
    <div className="p-8 max-w-4xl animate-fade-in">
      <button onClick={() => navigate('/pedidos')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all">
        <ArrowLeft className="w-4 h-4" /> Voltar para pedidos
      </button>

      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
            <FileSignature className="w-7 h-7" style={{ color: '#FFAF06' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-gray-900">{p.numero}</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.text }}>
                {st.label}
              </span>
            </div>
            <p className="text-gray-700 mt-1">{p.cliente?.razaoSocial}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 flex-wrap">
              <span>Criado: {fmtDate(p.createdAt)}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-display text-2xl font-bold text-gray-900">{fmt(Number(p.valor))}</div>
          </div>
        </div>

        {erro && (<div className="mt-3 p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}><AlertCircle className="w-4 h-4" /> {erro}</div>)}

        <div className="flex gap-2 flex-wrap pt-4 border-t" style={{ borderColor: '#F1EFE8' }}>
          {p.status !== 'CONCLUIDO' && p.status !== 'CANCELADO' && (
            <>
              <button onClick={() => mudarStatus('CONCLUIDO')} disabled={salvando} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50" style={{ background: '#EAF3DE', color: '#27500A' }}>
                Marcar como concluído
              </button>
              <button onClick={() => { if (confirm('Cancelar este pedido?')) mudarStatus('CANCELADO') }} disabled={salvando} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50" style={{ background: '#FDEEEE', color: '#8B0000' }}>
                Cancelar pedido
              </button>
            </>
          )}
          <button
            onClick={excluir}
            disabled={salvando}
            title="Excluir pedido + contrato + faturas não pagas (faturas pagas preservadas)"
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            style={{ border: '1px solid #FACACA' }}
          >
            <Trash2 className="w-3 h-3" /> Excluir pedido
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Cliente</h2>
          <p className="text-sm font-medium text-gray-700">{p.cliente?.razaoSocial}</p>
          <p className="text-xs text-gray-400">{p.cliente?.cnpj}</p>
          {contato && (
            <div className="mt-3 text-xs text-gray-500">
              <div className="font-medium">{contato.nome}</div>
              {contato.telefone && <div>{contato.telefone}</div>}
              {contato.email && <div>{contato.email}</div>}
            </div>
          )}
        </div>

        {p.orcamento && (
          <div
            onClick={() => navigate(`/orcamentos/${p.orcamento.id}`)}
            className="bg-white rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4" /> Orçamento de origem</h2>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-700 mt-3">{p.orcamento.numero}</p>
            <p className="text-xs text-gray-400 mt-1">Aprovado: {fmtDate(p.orcamento.dtAprovacao)}</p>
          </div>
        )}
      </div>

      {(p.contrato?.localMobilizacao || p.orcamento?.localMobilizacao) && (
        <div className="bg-white rounded-2xl p-5 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" style={{ color: '#FFAF06' }} /> Local de mobilização
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {p.contrato?.localMobilizacao || p.orcamento?.localMobilizacao}
          </p>
        </div>
      )}

      {p.contrato && (
        <div
          onClick={() => navigate(`/contratos/${p.contrato.id}`)}
          className="bg-white rounded-2xl p-6 mb-6 cursor-pointer hover:shadow-md transition-all"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4" /> Contrato gerado</h2>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium text-gray-700">{p.contrato.numero}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F1EFE8', color: '#888' }}>
              {p.contrato.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {p.contrato.status === 'RASCUNHO'
              ? '⚠ Contrato em rascunho. Abra para completar dados (forma de cobrança, dia de vencimento, foro, multa, etc) e ativar.'
              : 'Clique para ver o contrato.'}
          </p>
        </div>
      )}

      {p.observacoes && (
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-3">Observações</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.observacoes}</p>
        </div>
      )}
    </div>
  )
}
