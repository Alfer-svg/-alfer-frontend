import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Modal } from '../components/Modal'
import {
  Megaphone, Plus, Play, Pause, X, AlertCircle, CheckCircle2, RefreshCcw,
  Send, Clock, Users, Trash2, Loader2, MessageSquare, Mail,
} from 'lucide-react'

type StatusCampanha = 'RASCUNHO' | 'AGENDADA' | 'ENVIANDO' | 'CONCLUIDA' | 'PAUSADA' | 'CANCELADA'

type Campanha = {
  id: string
  nome: string
  templateName: string
  templateLanguage: string
  templateVars: any
  filtros: any
  dataAgendada: string | null
  delaySegundos: number
  totalDestinatarios: number
  totalEnviados: number
  totalEntregues: number
  totalLidos: number
  totalResponderam: number
  totalFalhas: number
  status: StatusCampanha
  observacoes: string | null
  iniciadaEm: string | null
  concluidaEm: string | null
  createdAt: string
}

const STATUS_COLOR: Record<StatusCampanha, { bg: string; text: string }> = {
  RASCUNHO:   { bg: '#F1EFE8', text: '#525252' },
  AGENDADA:   { bg: '#FEF3E2', text: '#7B5B0F' },
  ENVIANDO:   { bg: '#DBEAFE', text: '#1E40AF' },
  CONCLUIDA:  { bg: '#D1FAE5', text: '#065F46' },
  PAUSADA:    { bg: '#FEF3C7', text: '#92400E' },
  CANCELADA:  { bg: '#FEE2E2', text: '#991B1B' },
}

export default function Campanhas() {
  const [itens, setItens] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const navigate = useNavigate()

  const carregar = async () => {
    setLoading(true)
    try {
      const r = await api.get('/campanhas')
      setItens(r.data)
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  // Auto-refresh quando há campanha ENVIANDO
  useEffect(() => {
    if (itens.some((c) => c.status === 'ENVIANDO')) {
      const id = setInterval(carregar, 10_000)
      return () => clearInterval(id)
    }
  }, [itens])

  const acao = async (c: Campanha, endpoint: string, msg: string) => {
    try {
      await api.post(`/campanhas/${c.id}/${endpoint}`)
      setSucesso(msg)
      carregar()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-6 h-6" /> Campanhas WhatsApp
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/campanhas/email')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700"
            style={{ border: '1px solid #E0DDD8' }}
          >
            <Mail className="w-4 h-4" /> Campanha de E-mail
          </button>
          <button
            onClick={() => setCriando(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#FFAF06', color: '#7B5B0F' }}
          >
            <Plus className="w-4 h-4" /> Nova Campanha
          </button>
        </div>
      </div>

      {erro && (
        <div className="mb-3 p-3 rounded-lg flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {erro}
          <button onClick={() => setErro(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {sucesso && (
        <div className="mb-3 p-3 rounded-lg flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> {sucesso}
          <button onClick={() => setSucesso(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Carregando...</div>
      ) : itens.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <div>Nenhuma campanha ainda.</div>
          <button onClick={() => setCriando(true)} className="mt-3 text-sm text-amber-700 hover:underline">
            Criar primeira campanha
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {itens.map((c) => {
            const cor = STATUS_COLOR[c.status]
            const progresso = c.totalDestinatarios > 0
              ? Math.round(((c.totalEnviados + c.totalFalhas) / c.totalDestinatarios) * 100)
              : 0
            return (
              <div key={c.id} className="bg-white rounded-xl p-4" style={{ border: '1px solid #F1EFE8' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/campanhas/${c.id}`)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{c.nome}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: cor.bg, color: cor.text }}>
                        {c.status}
                      </span>
                      <span className="text-xs text-gray-500">template: <code className="bg-gray-100 px-1 rounded">{c.templateName}</code></span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {c.totalDestinatarios}</span>
                      <span className="inline-flex items-center gap-1"><Send className="w-3 h-3" /> {c.totalEnviados}</span>
                      <span className="inline-flex items-center gap-1">📬 entregues: {c.totalEntregues}</span>
                      <span className="inline-flex items-center gap-1">👁 lidos: {c.totalLidos}</span>
                      <span className="inline-flex items-center gap-1">💬 respostas: {c.totalResponderam}</span>
                      {c.totalFalhas > 0 && <span className="text-red-600">⚠ falhas: {c.totalFalhas}</span>}
                    </div>
                    {c.status === 'ENVIANDO' && c.totalDestinatarios > 0 && (
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${progresso}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {c.status === 'RASCUNHO' && (
                      <button onClick={() => acao(c, 'disparar', 'Disparo iniciado')} className="p-2 rounded hover:bg-emerald-50" title="Disparar">
                        <Play className="w-4 h-4 text-emerald-600" />
                      </button>
                    )}
                    {c.status === 'ENVIANDO' && (
                      <button onClick={() => acao(c, 'pausar', 'Campanha pausada')} className="p-2 rounded hover:bg-amber-50" title="Pausar">
                        <Pause className="w-4 h-4 text-amber-600" />
                      </button>
                    )}
                    {c.status === 'PAUSADA' && (
                      <button onClick={() => acao(c, 'disparar', 'Disparo retomado')} className="p-2 rounded hover:bg-emerald-50" title="Retomar">
                        <Play className="w-4 h-4 text-emerald-600" />
                      </button>
                    )}
                    {['RASCUNHO', 'CONCLUIDA', 'CANCELADA'].includes(c.status) && (
                      <button onClick={() => confirm(`Deletar "${c.nome}"?`) && acao(c, 'deletar', 'Campanha deletada')} className="p-2 rounded hover:bg-red-50" title="Deletar">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {criando && (
        <CriarCampanhaModal
          onClose={() => setCriando(false)}
          onCreated={(c) => {
            setCriando(false)
            setSucesso(`Campanha "${c.nome}" criada`)
            navigate(`/campanhas/${c.id}`)
          }}
        />
      )}
    </div>
  )
}

function CriarCampanhaModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: any) => void }) {
  const [nome, setNome] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [carregandoTemplates, setCarregandoTemplates] = useState(true)
  const [templateName, setTemplateName] = useState('')
  const [templateLanguage, setTemplateLanguage] = useState('pt_BR')
  const [templateVars, setTemplateVars] = useState<string[]>([])
  const [tagFiltro, setTagFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string[]>(['NOVO', 'QUALIFICADO'])
  const [delay, setDelay] = useState('30')
  const [agendar, setAgendar] = useState(false)
  const [dataAgendada, setDataAgendada] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/whatsapp/templates')
      .then((r) => {
        const aprovados = (r.data || []).filter((t: any) => t.status === 'APPROVED')
        setTemplates(aprovados)
      })
      .catch((e) => setErro(e.response?.data?.message || 'Erro ao listar templates'))
      .finally(() => setCarregandoTemplates(false))
  }, [])

  const onTemplateChange = (name: string) => {
    setTemplateName(name)
    const t = templates.find((x) => x.name === name)
    if (!t) { setTemplateVars([]); return }
    setTemplateLanguage(t.language || 'pt_BR')
    // Extrai placeholders {{1}}, {{2}} do corpo do template
    const body = (t.components || []).find((c: any) => c.type === 'BODY')
    const text = body?.text || ''
    const placeholders = (text.match(/\{\{\d+\}\}/g) || []) as string[]
    // Default: 1º placeholder = {{nome}}, 2º = {{empresa}}
    const labels = ['{{nome}}', '{{empresa}}', '{{var3}}', '{{var4}}']
    setTemplateVars(placeholders.map((_, i) => labels[i] || `{{var${i + 1}}}`))
  }

  const submit = async () => {
    if (!nome) return setErro('Nome obrigatório')
    if (!templateName) return setErro('Escolha um template')
    setLoading(true)
    setErro('')
    try {
      const dto: any = {
        nome,
        templateName,
        templateLanguage,
        templateVars,
        filtros: {
          tags: tagFiltro ? [tagFiltro] : undefined,
          status: statusFiltro.length ? statusFiltro : undefined,
        },
        delaySegundos: Number(delay) || 30,
      }
      if (agendar && dataAgendada) dto.dataAgendada = dataAgendada
      const r = await api.post('/campanhas', dto)
      // Constrói destinatários já
      await api.post(`/campanhas/${r.data.id}/destinatarios`)
      onCreated(r.data)
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao criar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <h2 className="font-display text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Megaphone className="w-5 h-5" /> Nova Campanha WhatsApp
      </h2>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Nome da campanha</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Construtoras Setembro 2026"
            className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Template aprovado (Meta)</label>
          {carregandoTemplates ? (
            <div className="text-xs text-gray-500 py-2"><Loader2 className="w-4 h-4 inline animate-spin" /> Carregando templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-xs text-amber-700 p-2 bg-amber-50 rounded">
              Nenhum template aprovado. Crie e submeta um no <a href="https://business.facebook.com/wa/manage/message-templates/" target="_blank" rel="noopener" className="underline">painel Meta</a> primeiro.
            </div>
          ) : (
            <select
              value={templateName}
              onChange={(e) => onTemplateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            >
              <option value="">— escolha um template —</option>
              {templates.map((t) => (
                <option key={t.name} value={t.name}>{t.name} ({t.category}) [{t.language}]</option>
              ))}
            </select>
          )}
        </div>

        {templateVars.length > 0 && (
          <div className="p-3 rounded-lg" style={{ background: '#FAFAF8', border: '1px solid #F1EFE8' }}>
            <div className="text-xs font-bold text-gray-600 mb-2">Variáveis do template:</div>
            <div className="space-y-1 text-xs text-gray-600">
              {templateVars.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-gray-400">{`{{${i + 1}}}`} =</span>
                  <code className="bg-white px-2 py-0.5 rounded">{v}</code>
                  <span className="text-gray-400 text-[10px]">— substituído por dado do lead</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-gray-500 mt-2">
              Suportado por padrão: <code>{`{{nome}}`}</code>, <code>{`{{empresa}}`}</code>.
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Filtrar por tag</label>
            <input
              value={tagFiltro}
              onChange={(e) => setTagFiltro(e.target.value)}
              placeholder="Ex: CAÇAMBA ESTACIONARIA RECORRENTE"
              className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Status do lead</label>
            <select
              multiple
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(Array.from(e.target.selectedOptions, (o) => o.value))}
              className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none"
              style={{ border: '1px solid #E0DDD8', height: 'auto' }}
              size={3}
            >
              {['NOVO', 'QUALIFICADO', 'PROPOSTA'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Delay entre mensagens (segundos)</label>
          <input
            type="number" min="5" max="300"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
            className="w-32 px-3 py-2 rounded-lg text-sm bg-white outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          />
          <p className="text-[10px] text-gray-500 mt-1">Recomendado 30s+ pra evitar warning antifraude.</p>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={agendar} onChange={(e) => setAgendar(e.target.checked)} />
            <Clock className="w-4 h-4" /> Agendar disparo
          </label>
          {agendar && (
            <input
              type="datetime-local"
              value={dataAgendada}
              onChange={(e) => setDataAgendada(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-lg text-sm bg-white outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
          )}
        </div>

        {erro && (
          <div className="p-2 rounded-lg text-xs text-red-700 bg-red-50 border border-red-200">{erro}</div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={loading || !templateName}
            className="flex-1 px-4 py-2 rounded-lg font-bold text-white disabled:opacity-50"
            style={{ background: '#FFAF06', color: '#7B5B0F' }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin inline mr-2" />}
            Criar campanha
          </button>
        </div>
      </div>
    </Modal>
  )
}
