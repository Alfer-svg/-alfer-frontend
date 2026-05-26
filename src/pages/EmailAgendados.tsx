import { useEffect, useState } from 'react'
import api from '../services/api'
import { Clock, Send, XCircle, AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react'

const statusInfo: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  PENDENTE:  { bg: '#FFF8E6', text: '#633806', label: 'Aguardando',  icon: Clock },
  ENVIADO:   { bg: '#EAF3DE', text: '#27500A', label: 'Enviado',     icon: CheckCircle2 },
  FALHOU:    { bg: '#FDEEEE', text: '#8B0000', label: 'Falhou',      icon: AlertCircle },
  CANCELADO: { bg: '#F1EFE8', text: '#888',    label: 'Cancelado',   icon: XCircle },
}

const fmtDateTime = (d?: string) => (d ? new Date(d).toLocaleString('pt-BR') : '—')
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function EmailAgendados() {
  const [agendados, setAgendados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>('PENDENTE')
  const [erro, setErro] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/email/agendamentos')
      .then((r) => setAgendados(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const cancelar = async (id: string) => {
    if (!confirm('Cancelar este agendamento? O e-mail NÃO será enviado.')) return
    setErro('')
    try {
      await api.delete(`/email/agendamentos/${id}`)
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao cancelar')
    }
  }

  const filtrados = filtroStatus === 'TODOS' ? agendados : agendados.filter((a) => a.status === filtroStatus)
  const contagens: Record<string, number> = { TODOS: agendados.length }
  for (const a of agendados) contagens[a.status] = (contagens[a.status] || 0) + 1

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-7 h-7" style={{ color: '#FFAF06' }} />
            E-mails agendados
          </h1>
          <p className="text-gray-500 text-sm mt-1">Envios programados de fatura/boleto</p>
        </div>
      </div>

      <div className="flex gap-2 my-6 flex-wrap">
        {[
          { v: 'PENDENTE',  l: 'Aguardando', cor: '#FFAF06' },
          { v: 'ENVIADO',   l: 'Enviados',   cor: '#27500A' },
          { v: 'FALHOU',    l: 'Falharam',   cor: '#8B0000' },
          { v: 'CANCELADO', l: 'Cancelados', cor: '#888' },
          { v: 'TODOS',     l: 'Todos',      cor: '#1A1C1E' },
        ].map((t) => {
          const ativo = filtroStatus === t.v
          const n = contagens[t.v] || 0
          return (
            <button
              key={t.v}
              onClick={() => setFiltroStatus(t.v)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: ativo ? t.cor : '#F1EFE8',
                color: ativo ? 'white' : '#555',
              }}
            >
              {t.l}
              <span
                className="px-1.5 py-0.5 rounded-md text-[11px] font-semibold"
                style={{
                  background: ativo ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                  color: ativo ? 'white' : '#555',
                  minWidth: 22, textAlign: 'center',
                }}
              >
                {n}
              </span>
            </button>
          )
        })}
      </div>

      {erro && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2"
             style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FFAF06' }} />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum agendamento {filtroStatus !== 'TODOS' ? `com status "${statusInfo[filtroStatus]?.label || filtroStatus}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {filtrados.map((a) => {
            const st = statusInfo[a.status] || statusInfo.PENDENTE
            const Icon = st.icon
            const lanc = a.lancamento
            const numero = lanc?.numeroFatura ? `NF ${lanc.numeroFatura}` : 'Fatura'
            return (
              <div key={a.id}
                   className="bg-white rounded-2xl p-5 flex items-start gap-4 animate-fade-in"
                   style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: st.bg }}>
                  <Icon className="w-5 h-5" style={{ color: st.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{numero}</span>
                    <span className="text-sm text-gray-700">{lanc?.cliente?.razaoSocial || '—'}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.text }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span>Pra: <b>{a.destinatario}</b></span>
                    {a.cc && <span>Cc: {a.cc}</span>}
                    {lanc?.valor != null && <span>Valor: {fmt(Number(lanc.valor))}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                    <span>
                      {a.status === 'ENVIADO'
                        ? <>Enviado em <b>{fmtDateTime(a.sentAt)}</b></>
                        : a.status === 'CANCELADO'
                        ? <>Cancelado · era pra {fmtDateTime(a.dataAgendada)}</>
                        : <>Agendado pra <b>{fmtDateTime(a.dataAgendada)}</b></>}
                    </span>
                    {a.tentativas > 0 && a.status !== 'ENVIADO' && (
                      <span style={{ color: '#8B0000' }}>{a.tentativas} tentativa(s)</span>
                    )}
                  </div>
                  {a.erro && (
                    <div className="text-[11px] text-red-700 mt-1.5 p-2 rounded-lg" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
                      <b>Erro:</b> {a.erro}
                    </div>
                  )}
                </div>
                {a.status === 'PENDENTE' && (
                  <button
                    onClick={() => cancelar(a.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 flex-shrink-0"
                    style={{ border: '1px solid #FACACA' }}
                  >
                    <XCircle className="w-3 h-3 inline mr-1" /> Cancelar
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
