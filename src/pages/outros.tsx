// Financeiro — outras páginas agora têm arquivos próprios
import { useState, useEffect } from 'react'
import api from '../services/api'
import { DollarSign, TrendingUp, TrendingDown, Clock, FileDown, XCircle, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'

async function abrirFaturaPdf(id: string) {
  try {
    const token = localStorage.getItem('alfer_token')
    const baseUrl = (api.defaults.baseURL || '').replace(/\/$/, '')
    const r = await fetch(`${baseUrl}/financeiro/lancamentos/${id}/fatura-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) throw new Error('Erro ao gerar fatura')
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  } catch (err: any) {
    alert(err.message || 'Erro ao baixar fatura.')
  }
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export function Financeiro() {
  const [dash, setDash] = useState<any>(null)
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [erroAcao, setErroAcao] = useState('')

  const carregar = () => {
    return Promise.all([
      api.get('/financeiro/dashboard'),
      api.get('/financeiro/lancamentos'),
    ]).then(([d, l]) => {
      setDash(d.data)
      setLancamentos(l.data.slice(0, 15))
    })
  }

  useEffect(() => {
    carregar().finally(() => setLoading(false))
  }, [])

  const marcarPago = async (l: any) => {
    const hoje = new Date().toISOString().slice(0, 10)
    const dt = prompt(
      `Marcar fatura de ${l.cliente?.razaoSocial || l.fornecedor || 'sem cliente'} (R$ ${l.valor}) como PAGA.\n\nData do pagamento (AAAA-MM-DD):`,
      hoje
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
    if (!confirm(`Cancelar a fatura de ${l.cliente?.razaoSocial || l.fornecedor || 'sem cliente'} no valor de R$ ${l.valor}?\n\nO histórico fica preservado, só muda o status pra CANCELADO.`)) return
    setErroAcao('')
    try {
      await api.put(`/financeiro/lancamentos/${l.id}/cancelar`)
      await carregar()
    } catch (e: any) {
      setErroAcao(e.response?.data?.message || 'Erro ao cancelar')
    }
  }

  const excluir = async (l: any) => {
    if (!confirm(`EXCLUIR PERMANENTEMENTE essa fatura?\n\nIsso apaga o lançamento do banco — não dá pra desfazer. Se quiser preservar o histórico, use Cancelar.`)) return
    if (!confirm('Tem certeza? Confirma a exclusão.')) return
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-gray-500 text-sm mt-1">Receitas, despesas e fluxo de caixa</p>
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

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Lançamentos recentes</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {lancamentos.map((l) => (
            <div key={l.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2`} style={{ background: l.tipo === 'RECEITA' ? '#27AE60' : '#E74C3C' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{l.descricao}</div>
                  <div className="text-xs text-gray-400 truncate">{l.cliente?.razaoSocial || l.fornecedor || '—'}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold" style={{ color: l.tipo === 'RECEITA' ? '#27AE60' : '#E74C3C' }}>
                    {l.tipo === 'RECEITA' ? '+' : '-'}{fmt(l.valor)}
                  </div>
                  <div className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: '#F1EFE8', color: statusColor[l.status] || '#888' }}>
                    {l.status}
                  </div>
                </div>
              </div>
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
                  {l.status !== 'PAGO' && l.status !== 'CANCELADO' && l.tipo === 'RECEITA' && (
                    <button
                      onClick={() => marcarPago(l)}
                      title="Marcar fatura como paga"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white hover:opacity-90"
                      style={{ background: '#27AE60' }}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Pagar
                    </button>
                  )}
                  {l.status !== 'PAGO' && l.status !== 'CANCELADO' && (
                    <button
                      onClick={() => cancelar(l)}
                      title="Cancelar (mantém no histórico)"
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
          ))}
          {lancamentos.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhum lançamento encontrado</div>
          )}
        </div>
      </div>
    </div>
  )
}
