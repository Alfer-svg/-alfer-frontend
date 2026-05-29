import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Mail, Send, Users, Loader2, AlertCircle, CheckCircle2, ArrowLeft, FlaskConical } from 'lucide-react'

const SEGMENTOS = [
  { v: '', l: 'Todos os segmentos' },
  { v: 'CONSTRUTORA', l: 'Construtora' },
  { v: 'INDUSTRIA_REFINARIA', l: 'Indústria / Refinaria' },
  { v: 'PORTO_LOGISTICA', l: 'Porto / Logística' },
  { v: 'PREFEITURA_GOVERNO', l: 'Prefeitura / Governo' },
  { v: 'OUTROS', l: 'Outros' },
]

const STATUS = [
  { v: '', l: 'Todos os status' },
  { v: 'ATIVO', l: 'Ativos' },
  { v: 'ALERTA', l: 'Alerta' },
  { v: 'INADIMPLENTE', l: 'Inadimplente' },
  { v: 'INATIVO', l: 'Inativo' },
]

const CORPO_PADRAO = `<p>Olá!</p>
<p>Estamos com uma <strong>condição especial de caçamba estacionária</strong> pra retirada de entulho da sua obra: <strong>10% de desconto na primeira locação</strong> pra quem fechar essa semana.</p>
<p>Entrega rápida na Região Metropolitana do Recife e Suape. Quer que a gente reserve uma pra você?</p>
<p>É só responder este e-mail ou chamar no <strong>0800 620 0050 / (81) 9 7109-4000</strong>.</p>
<p>Abraço,<br/>Equipe Alfer Equipamentos</p>`

export default function CampanhaEmail() {
  const navigate = useNavigate()
  const [assunto, setAssunto] = useState('Caçamba com 10% off na primeira locação — Alfer')
  const [corpoHtml, setCorpoHtml] = useState(CORPO_PADRAO)
  const [segmento, setSegmento] = useState('')
  const [status, setStatus] = useState('')
  const [ctaTexto, setCtaTexto] = useState('Quero minha caçamba (10% off)')
  const [ctaUrl, setCtaUrl] = useState(
    'https://wa.me/5581971094000?text=' + encodeURIComponent('Olá! Vi a oferta de 10% off e quero locar uma caçamba.'),
  )
  const [preview, setPreview] = useState<{ total: number; amostra: any[] } | null>(null)
  const [emailTeste, setEmailTeste] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const carregarPreview = async () => {
    try {
      const params: any = {}
      if (segmento) params.segmento = segmento
      if (status) params.status = status
      const r = await api.get('/email/campanha/preview', { params })
      setPreview(r.data)
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao carregar prévia')
    }
  }

  useEffect(() => { carregarPreview() }, [segmento, status])

  const enviarTeste = async () => {
    if (!emailTeste) return setErro('Informe um e-mail pra teste')
    setLoading(true); setErro(''); setSucesso('')
    try {
      await api.post('/email/campanha/disparar', { assunto, corpoHtml, ctaTexto, ctaUrl, teste: emailTeste })
      setSucesso(`E-mail de teste enviado pra ${emailTeste}`)
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao enviar teste')
    } finally {
      setLoading(false)
    }
  }

  const disparar = async () => {
    if (!preview?.total) return setErro('Nenhum cliente com e-mail nesse filtro.')
    if (!confirm(`Disparar a campanha pra ${preview.total} cliente(s) com e-mail?\n\nIsso envia de verdade. Confirma?`)) return
    setLoading(true); setErro(''); setSucesso('')
    try {
      const dto: any = { assunto, corpoHtml, ctaTexto, ctaUrl }
      if (segmento) dto.segmento = segmento
      if (status) dto.status = status
      const r = await api.post('/email/campanha/disparar', dto)
      setSucesso(`Campanha enviada: ${r.data.enviados}/${r.data.total} • falhas: ${r.data.falhas}`)
      carregarPreview()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao disparar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm bg-white outline-none'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/campanhas')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        <Mail className="w-6 h-6" /> Campanha de E-mail
      </h1>
      <p className="text-gray-500 text-sm mb-5">Dispara pra base de clientes com e-mail cadastrado. Não depende da Meta.</p>

      {erro && (
        <div className="mb-3 p-3 rounded-lg flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {erro}
        </div>
      )}
      {sucesso && (
        <div className="mb-3 p-3 rounded-lg flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> {sucesso}
        </div>
      )}

      <div className="space-y-4 bg-white rounded-2xl p-5" style={{ border: '1px solid #F1EFE8' }}>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Assunto</label>
          <input value={assunto} onChange={(e) => setAssunto(e.target.value)} className={inputCls} style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Corpo (HTML simples)</label>
          <textarea value={corpoHtml} onChange={(e) => setCorpoHtml(e.target.value)} rows={9} className={`${inputCls} font-mono`} style={inputStyle} />
          <p className="text-[10px] text-gray-500 mt-1">Aceita HTML básico (&lt;p&gt;, &lt;strong&gt;, &lt;br/&gt;). É embrulhado no layout da Alfer automaticamente.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl" style={{ background: '#FAFAF8', border: '1px solid #F1EFE8' }}>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Texto do botão (CTA)</label>
            <input value={ctaTexto} onChange={(e) => setCtaTexto(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Link do botão</label>
            <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className={inputCls} style={inputStyle} />
            <p className="text-[10px] text-gray-500 mt-1">Padrão: abre o WhatsApp da Alfer com a mensagem pronta. Deixe vazio pra não mostrar botão.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Segmento</label>
            <select value={segmento} onChange={(e) => setSegmento(e.target.value)} className={inputCls} style={inputStyle}>
              {SEGMENTOS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Status do cliente</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls} style={inputStyle}>
              {STATUS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#FEF3E2', color: '#7B5B0F' }}>
          <Users className="w-4 h-4" />
          <span className="text-sm font-semibold">
            {preview ? `${preview.total} cliente(s) com e-mail vão receber` : 'Carregando prévia...'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="flex gap-2 flex-1">
            <input
              value={emailTeste}
              onChange={(e) => setEmailTeste(e.target.value)}
              placeholder="seu@email.com (teste)"
              className={inputCls}
              style={inputStyle}
            />
            <button
              onClick={enviarTeste}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 whitespace-nowrap disabled:opacity-50"
              style={{ border: '1px solid #E0DDD8' }}
            >
              <FlaskConical className="w-4 h-4" /> Teste
            </button>
          </div>
          <button
            onClick={disparar}
            disabled={loading || !preview?.total}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 disabled:opacity-50"
            style={{ background: '#FFAF06' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Disparar campanha
          </button>
        </div>
      </div>
    </div>
  )
}
