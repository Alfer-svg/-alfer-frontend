import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, BellRing, Mail, MessageCircle, Loader2, CheckCircle2, AlertCircle, Send, Clock } from 'lucide-react'
import { fmtDate } from '../utils/data'

type Config = {
  ativo: boolean
  diasAntes: number[]
  lembrarNoDia: boolean
  diasDepois: number[]
  canalEmail: boolean
  canalWhatsapp: boolean
  horaDisparo: number
  templateWhatsapp: string
}

const fmtMoeda = (v: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
      style={{ background: on ? '#FFAF06' : '#D1CEC8' }}
    >
      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform" style={{ transform: on ? 'translateX(20px)' : 'none' }} />
    </button>
  )
}

export default function ConfigLembretes() {
  const navigate = useNavigate()
  const [cfg, setCfg] = useState<Config | null>(null)
  const [historico, setHistorico] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [disparando, setDisparando] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  const carregar = () => {
    Promise.all([api.get('/lembretes/config'), api.get('/lembretes/historico', { params: { limite: 50 } })])
      .then(([c, h]) => { setCfg(c.data); setHistorico(h.data) })
      .catch(() => setErro('Erro ao carregar configuração.'))
      .finally(() => setLoading(false))
  }
  useEffect(carregar, [])

  const set = (k: keyof Config, v: any) => setCfg((c) => (c ? { ...c, [k]: v } : c))

  const salvar = async () => {
    if (!cfg) return
    setSalvando(true); setMsg(''); setErro('')
    try {
      await api.put('/lembretes/config', cfg)
      setMsg('Configuração salva.')
      setTimeout(() => setMsg(''), 3000)
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const dispararAgora = async () => {
    if (!confirm('Isso envia os lembretes de verdade agora (e-mail e WhatsApp) para as faturas elegíveis hoje. Continuar?')) return
    setDisparando(true); setMsg(''); setErro('')
    try {
      const r = await api.post('/lembretes/processar-agora')
      const d = r.data
      setMsg(`Processado: ${d.enviados} enviado(s), ${d.falhas} falha(s), ${d.pulados} sem contato.`)
      carregar()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao disparar.')
    } finally {
      setDisparando(false)
    }
  }

  if (loading || !cfg) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>

  const card = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <div className="p-8 max-w-3xl animate-fade-in">
      <button onClick={() => navigate('/financeiro')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all">
        <ArrowLeft className="w-4 h-4" /> Voltar para financeiro
      </button>
      <div className="mb-8 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#FEF3E2' }}>
          <BellRing className="w-5 h-5" style={{ color: '#FFAF06' }} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Lembretes de vencimento</h1>
          <p className="text-gray-500 text-sm mt-0.5">Avisos automáticos de fatura por e-mail e WhatsApp</p>
        </div>
      </div>

      {/* Ativar */}
      <div className="bg-white rounded-2xl p-6 mb-6 flex items-center justify-between" style={card}>
        <div>
          <h2 className="font-semibold text-gray-900">Lembretes automáticos</h2>
          <p className="text-gray-500 text-sm mt-0.5">Liga/desliga o envio automático pra todos os clientes (exceto os que você desativar individualmente).</p>
        </div>
        <Toggle on={cfg.ativo} onClick={() => set('ativo', !cfg.ativo)} />
      </div>

      {/* Cadência */}
      <div className="bg-white rounded-2xl p-6 mb-6" style={card}>
        <h2 className="font-semibold text-gray-900 mb-1">Quando avisar</h2>
        <p className="text-gray-500 text-sm mb-4">Em relação à data de vencimento da fatura.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dias antes do vencimento</label>
            <input
              value={cfg.diasAntes.join(', ')}
              onChange={(e) => set('diasAntes', e.target.value.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n > 0))}
              placeholder="Ex: 3"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white"
              style={inputStyle}
            />
            <p className="text-xs text-gray-400 mt-1">Separe por vírgula pra avisar em mais de um dia (ex: 5, 1).</p>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Avisar no dia do vencimento</label>
            <Toggle on={cfg.lembrarNoDia} onClick={() => set('lembrarNoDia', !cfg.lembrarNoDia)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dias depois (cobrança de vencida)</label>
            <input
              value={cfg.diasDepois.join(', ')}
              onChange={(e) => set('diasDepois', e.target.value.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n > 0))}
              placeholder="Ex: 3, 7"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white"
              style={inputStyle}
            />
            <p className="text-xs text-gray-400 mt-1">Reenvia a cobrança se a fatura continuar não paga.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário de disparo</label>
            <select value={cfg.horaDisparo} onChange={(e) => set('horaDisparo', Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white" style={inputStyle}>
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">Horário de Brasília (BRT).</p>
          </div>
        </div>
      </div>

      {/* Canais */}
      <div className="bg-white rounded-2xl p-6 mb-6" style={card}>
        <h2 className="font-semibold text-gray-900 mb-4">Canais</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">E-mail</p>
                <p className="text-xs text-gray-400">Para os contatos marcados como "recebe fatura".</p>
              </div>
            </div>
            <Toggle on={cfg.canalEmail} onClick={() => set('canalEmail', !cfg.canalEmail)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">WhatsApp</p>
                <p className="text-xs text-gray-400">Usa template aprovado pela Meta.</p>
              </div>
            </div>
            <Toggle on={cfg.canalWhatsapp} onClick={() => set('canalWhatsapp', !cfg.canalWhatsapp)} />
          </div>
          {cfg.canalWhatsapp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do template WhatsApp</label>
              <input
                value={cfg.templateWhatsapp}
                onChange={(e) => set('templateWhatsapp', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white font-mono"
                style={inputStyle}
              />
              <div className="mt-2 p-3 rounded-xl text-xs text-gray-600" style={{ background: '#FEF3E2', border: '1px solid #F5D89A' }}>
                O template precisa estar <strong>aprovado pela Meta</strong> com 3 variáveis no corpo, nesta ordem:
                <br />{'{{1}}'} nº da fatura · {'{{2}}'} valor · {'{{3}}'} data de vencimento.
              </div>
            </div>
          )}
        </div>
      </div>

      {(msg || erro) && (
        <div className={`p-3 mb-4 rounded-xl text-sm flex items-center gap-2`} style={erro ? { background: '#FDEEEE', border: '1px solid #FACACA', color: '#B91C1C' } : { background: '#EAF3DE', border: '1px solid #C5DDA2', color: '#27500A' }}>
          {erro ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {erro || msg}
        </div>
      )}

      <div className="flex gap-3 mb-10">
        <button onClick={salvar} disabled={salvando} className="flex-1 py-3 rounded-xl font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: salvando ? '#CC8C00' : '#FFAF06' }}>
          {salvando ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar configuração'}
        </button>
        <button onClick={dispararAgora} disabled={disparando} className="px-5 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white flex items-center gap-2" style={inputStyle}>
          {disparando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Disparar agora
        </button>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-2xl p-6" style={card}>
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> Últimos lembretes enviados</h2>
        {historico.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum lembrete enviado ainda.</p>
        ) : (
          <div className="space-y-2">
            {historico.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#F1EFE8' }}>
                <div className="flex items-center gap-3 min-w-0">
                  {h.canal === 'EMAIL' ? <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">
                      {h.lancamento?.cliente?.razaoSocial || '—'} · NF {h.lancamento?.numeroFatura || '—'} · {fmtMoeda(h.lancamento?.valor)}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{h.marco} · {h.destinatario || '—'} {h.erro ? `· ${h.erro}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={h.status === 'ENVIADO' ? { background: '#EAF3DE', color: '#27500A' } : { background: '#FDEEEE', color: '#B91C1C' }}>
                    {h.status === 'ENVIADO' ? 'Enviado' : 'Falhou'}
                  </span>
                  <span className="text-xs text-gray-400">{fmtDate(h.enviadoEm)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
