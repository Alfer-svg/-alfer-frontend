import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import { Modal } from '../components/Modal'
import {
  Megaphone, Plus, Play, Pause, X, AlertCircle, CheckCircle2, RefreshCcw,
  Send, Clock, Users, Trash2, Loader2, MessageSquare, Mail, Search,
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
  const [preCrmIds, setPreCrmIds] = useState<string[] | undefined>(undefined)
  const navigate = useNavigate()
  const location = useLocation()

  // Chegou do CRM com oportunidades selecionadas → abre o modal já no modo CRM
  useEffect(() => {
    const ids = (location.state as any)?.oportunidadeIds as string[] | undefined
    if (ids?.length) {
      setPreCrmIds(ids)
      setCriando(true)
      navigate(location.pathname, { replace: true, state: {} }) // limpa o state
    }
  }, [location.state])

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
          preCrmIds={preCrmIds}
          onClose={() => { setCriando(false); setPreCrmIds(undefined) }}
          onCreated={(c) => {
            setCriando(false)
            setPreCrmIds(undefined)
            setSucesso(`Campanha "${c.nome}" criada`)
            carregar()
          }}
        />
      )}
    </div>
  )
}

function CriarCampanhaModal({ onClose, onCreated, preCrmIds }: { onClose: () => void; onCreated: (c: any) => void; preCrmIds?: string[] }) {
  const [nome, setNome] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [carregandoTemplates, setCarregandoTemplates] = useState(true)
  const [templateName, setTemplateName] = useState('')
  const [templateLanguage, setTemplateLanguage] = useState('pt_BR')
  const [templateVars, setTemplateVars] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [precisaImagem, setPrecisaImagem] = useState(false)
  const [headerImageUrl, setHeaderImageUrl] = useState('')
  const [tagFiltro, setTagFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string[]>(['NOVO', 'QUALIFICADO'])
  // Público: 'filtro' (tag/status), 'lista' (leads na mão) ou 'crm' (oportunidades)
  const [modoPublico, setModoPublico] = useState<'filtro' | 'lista' | 'crm'>(preCrmIds?.length ? 'crm' : 'filtro')
  const [leads, setLeads] = useState<any[]>([])
  const [carregandoLeads, setCarregandoLeads] = useState(false)
  const [buscaLead, setBuscaLead] = useState('')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  // Fonte CRM
  const [ops, setOps] = useState<any[]>([])
  const [carregandoOps, setCarregandoOps] = useState(false)
  const [buscaOp, setBuscaOp] = useState('')
  const [estagiosFiltro, setEstagiosFiltro] = useState<string[]>([])
  const [opsSelec, setOpsSelec] = useState<Set<string>>(new Set(preCrmIds || []))
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

  // Carrega leads com telefone (uma vez) ao abrir o modo "escolher da lista"
  useEffect(() => {
    if (modoPublico !== 'lista' || leads.length > 0) return
    setCarregandoLeads(true)
    api.get('/leads', { params: { limite: 500 } })
      .then((r) => setLeads((r.data || []).filter((l: any) => l.telefone && !l.optOutMarketing)))
      .catch((e) => setErro(e.response?.data?.message || 'Erro ao carregar leads'))
      .finally(() => setCarregandoLeads(false))
  }, [modoPublico])

  const leadsFiltrados = leads.filter((l) => {
    if (!buscaLead.trim()) return true
    const q = buscaLead.toLowerCase()
    return [l.nome, l.empresa, l.telefone, l.email].filter(Boolean).some((x: string) => x.toLowerCase().includes(q))
  })

  const toggleLead = (id: string) => setSelecionados((s) => {
    const n = new Set(s)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })
  const toggleTodos = () => setSelecionados((s) => {
    const visiveis = leadsFiltrados.map((l) => l.id)
    const todosSelec = visiveis.every((id) => s.has(id))
    const n = new Set(s)
    if (todosSelec) visiveis.forEach((id) => n.delete(id))
    else visiveis.forEach((id) => n.add(id))
    return n
  })

  // ── Fonte CRM: carrega oportunidades (achatadas do kanban) ──────────────────
  useEffect(() => {
    if (modoPublico !== 'crm' || ops.length > 0) return
    setCarregandoOps(true)
    api.get('/crm/kanban')
      .then((r) => {
        const colunas = r.data?.colunas || {}
        const flat = Object.entries(colunas).flatMap(([estagio, arr]: any) =>
          (arr as any[]).map((o) => ({ ...o, estagio })))
        // Só vale pra WhatsApp quem tem telefone direto ou cliente vinculado
        setOps(flat.filter((o) => o.prospectTelefone || o.clienteId))
      })
      .catch((e) => setErro(e.response?.data?.message || 'Erro ao carregar CRM'))
      .finally(() => setCarregandoOps(false))
  }, [modoPublico])

  const opsFiltradas = ops.filter((o) => {
    if (estagiosFiltro.length && !estagiosFiltro.includes(o.estagio)) return false
    if (!buscaOp.trim()) return true
    const q = buscaOp.toLowerCase()
    return [o.titulo, o.prospectNome, o.prospectEmpresa, o.prospectTelefone, o.cliente?.razaoSocial]
      .filter(Boolean).some((x: string) => x.toLowerCase().includes(q))
  })
  const toggleOp = (id: string) => setOpsSelec((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleTodasOps = () => setOpsSelec((s) => {
    const visiveis = opsFiltradas.map((o) => o.id)
    const todasSelec = visiveis.every((id) => s.has(id))
    const n = new Set(s)
    if (todasSelec) visiveis.forEach((id) => n.delete(id))
    else visiveis.forEach((id) => n.add(id))
    return n
  })

  const onTemplateChange = (name: string) => {
    setTemplateName(name)
    const t = templates.find((x) => x.name === name)
    if (!t) { setTemplateVars([]); setSelectedTemplate(null); return }
    setSelectedTemplate(t)
    setTemplateLanguage(t.language || 'pt_BR')
    // Extrai placeholders {{1}}, {{2}} do corpo do template
    const body = (t.components || []).find((c: any) => c.type === 'BODY')
    const text = body?.text || ''
    const placeholders = (text.match(/\{\{\d+\}\}/g) || []) as string[]
    // Default: 1º placeholder = {{nome}}, 2º = {{empresa}}
    const labels = ['{{nome}}', '{{empresa}}', '{{var3}}', '{{var4}}']
    setTemplateVars(placeholders.map((_, i) => labels[i] || `{{var${i + 1}}}`))
    // Header tipo IMAGE precisa de uma URL pública da imagem no envio
    const header = (t.components || []).find((c: any) => c.type === 'HEADER')
    const ehImagem = header?.format === 'IMAGE'
    setPrecisaImagem(ehImagem)
    // Prefill com a imagem de exemplo do template (pode expirar — ideal trocar por URL fixa)
    setHeaderImageUrl(ehImagem ? (header?.example?.header_handle?.[0] || '') : '')
  }

  const submit = async () => {
    if (!nome) return setErro('Nome obrigatório')
    if (!templateName) return setErro('Escolha um template')
    if (precisaImagem && !headerImageUrl.trim()) return setErro('Este template tem imagem no cabeçalho — informe a URL da imagem.')
    if (modoPublico === 'lista' && selecionados.size === 0) return setErro('Selecione pelo menos um contato da lista.')
    if (modoPublico === 'crm' && opsSelec.size === 0) return setErro('Selecione pelo menos uma oportunidade do CRM.')
    setLoading(true)
    setErro('')
    try {
      const filtros = modoPublico === 'lista'
        ? { leadIds: Array.from(selecionados) }
        : modoPublico === 'crm'
          ? { oportunidadeIds: Array.from(opsSelec) }
          : {
              tags: tagFiltro ? [tagFiltro] : undefined,
              status: statusFiltro.length ? statusFiltro : undefined,
            }
      const dto: any = {
        nome,
        templateName,
        templateLanguage,
        templateVars,
        headerImageUrl: precisaImagem ? headerImageUrl.trim() : undefined,
        filtros,
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

        {precisaImagem && (
          <div className="p-3 rounded-lg" style={{ background: '#FEF3E2', border: '1px solid #FCD34D' }}>
            <label className="block text-xs font-bold text-gray-700 mb-1">URL da imagem do cabeçalho (obrigatório neste template)</label>
            <input
              value={headerImageUrl}
              onChange={(e) => setHeaderImageUrl(e.target.value)}
              placeholder="https://...imagem.jpg"
              className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
            <p className="text-[10px] text-gray-600 mt-1">
              Este template tem imagem no topo. Cole uma URL pública (.jpg/.png). A imagem de exemplo do template pode expirar — prefira uma URL fixa do seu site.
            </p>
          </div>
        )}

        {selectedTemplate && (
          <TemplatePreview template={selectedTemplate} headerImageUrl={precisaImagem ? headerImageUrl : ''} />
        )}

        {/* PÚBLICO: por filtro ou escolher da lista */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Quem vai receber</label>
          <div className="flex gap-1 p-1 rounded-lg mb-2" style={{ background: '#F1EFE8' }}>
            {[
              { v: 'filtro', label: 'Por filtro' },
              { v: 'lista', label: 'Da lista' },
              { v: 'crm', label: 'Do CRM' },
            ].map((m) => (
              <button
                key={m.v}
                type="button"
                onClick={() => setModoPublico(m.v as any)}
                className="flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={modoPublico === m.v
                  ? { background: '#fff', color: '#7B5B0F', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                  : { color: '#8A8579' }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {modoPublico === 'filtro' ? (
            <div className="grid grid-cols-2 gap-3">
              <div key="tag-field">
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Filtrar por tag</label>
                <input
                  value={tagFiltro}
                  onChange={(e) => setTagFiltro(e.target.value)}
                  placeholder="Ex: CAÇAMBA ESTACIONARIA RECORRENTE"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none"
                  style={{ border: '1px solid #E0DDD8' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Status do lead</label>
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
          ) : modoPublico === 'lista' ? (
            <div className="rounded-lg" style={{ border: '1px solid #E0DDD8' }}>
              <div className="flex items-center gap-2 p-2 border-b" style={{ borderColor: '#F1EFE8' }}>
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input
                  value={buscaLead}
                  onChange={(e) => setBuscaLead(e.target.value)}
                  placeholder="Buscar nome, empresa, telefone..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
                <button type="button" onClick={toggleTodos} className="text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap">
                  {leadsFiltrados.length > 0 && leadsFiltrados.every((l) => selecionados.has(l.id)) ? 'Limpar' : 'Todos'}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {carregandoLeads ? (
                  <div className="text-xs text-gray-400 p-4 text-center"><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Carregando leads...</div>
                ) : leadsFiltrados.length === 0 ? (
                  <div className="text-xs text-gray-400 p-4 text-center">Nenhum lead com telefone encontrado.</div>
                ) : (
                  leadsFiltrados.map((l) => (
                    <label key={l.id} className="flex items-center gap-2 px-3 py-2 hover:bg-amber-50 cursor-pointer border-b last:border-0" style={{ borderColor: '#F7F5F0' }}>
                      <input type="checkbox" checked={selecionados.has(l.id)} onChange={() => toggleLead(l.id)} />
                      <span className="flex-1 min-w-0">
                        <span className="text-sm text-gray-800 font-medium">{l.nome || l.empresa || '(sem nome)'}</span>
                        {l.empresa && l.nome && <span className="text-xs text-gray-400"> · {l.empresa}</span>}
                        <span className="block text-[11px] text-gray-400">{l.telefone}{l.status ? ` · ${l.status}` : ''}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              <div className="p-2 border-t text-xs text-gray-500 flex items-center gap-1" style={{ borderColor: '#F1EFE8' }}>
                <Users className="w-3 h-3" /> {selecionados.size} selecionado(s)
                <span className="text-gray-300">· descadastrados não aparecem aqui</span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg" style={{ border: '1px solid #E0DDD8' }}>
              {/* Filtro por estágio do pipeline */}
              <div className="flex flex-wrap gap-1 p-2 border-b" style={{ borderColor: '#F1EFE8' }}>
                {['NOVO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO'].map((e) => {
                  const on = estagiosFiltro.includes(e)
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEstagiosFiltro((s) => on ? s.filter((x) => x !== e) : [...s, e])}
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={on ? { background: '#FFAF06', color: '#7B5B0F' } : { background: '#F1EFE8', color: '#8A8579' }}
                    >
                      {e}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 p-2 border-b" style={{ borderColor: '#F1EFE8' }}>
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input
                  value={buscaOp}
                  onChange={(e) => setBuscaOp(e.target.value)}
                  placeholder="Buscar oportunidade, cliente, telefone..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
                <button type="button" onClick={toggleTodasOps} className="text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap">
                  {opsFiltradas.length > 0 && opsFiltradas.every((o) => opsSelec.has(o.id)) ? 'Limpar' : 'Todos'}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {carregandoOps ? (
                  <div className="text-xs text-gray-400 p-4 text-center"><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Carregando CRM...</div>
                ) : opsFiltradas.length === 0 ? (
                  <div className="text-xs text-gray-400 p-4 text-center">Nenhuma oportunidade com contato.</div>
                ) : (
                  opsFiltradas.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 px-3 py-2 hover:bg-amber-50 cursor-pointer border-b last:border-0" style={{ borderColor: '#F7F5F0' }}>
                      <input type="checkbox" checked={opsSelec.has(o.id)} onChange={() => toggleOp(o.id)} />
                      <span className="flex-1 min-w-0">
                        <span className="text-sm text-gray-800 font-medium">{o.prospectNome || o.cliente?.razaoSocial || o.titulo}</span>
                        <span className="ml-1 text-[10px] font-semibold text-amber-700">{o.estagio}</span>
                        <span className="block text-[11px] text-gray-400">
                          {o.prospectTelefone || (o.clienteId ? 'telefone via cliente' : '—')}
                          {o.prospectEmpresa ? ` · ${o.prospectEmpresa}` : ''}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              <div className="p-2 border-t text-xs text-gray-500 flex items-center gap-1" style={{ borderColor: '#F1EFE8' }}>
                <Users className="w-3 h-3" /> {opsSelec.size} oportunidade(s)
                <span className="text-gray-300">· descadastrados são removidos no disparo</span>
              </div>
            </div>
          )}
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

// Valores de exemplo pra preencher as variáveis do corpo no preview
const EXEMPLO_VARS: Record<number, string> = {
  1: 'João Silva',
  2: 'Construtora Exemplo',
  3: 'exemplo 3',
  4: 'exemplo 4',
}

function TemplatePreview({ template, headerImageUrl }: { template: any; headerImageUrl?: string }) {
  const components = template?.components || []
  const header = components.find((c: any) => c.type === 'HEADER')
  const body = components.find((c: any) => c.type === 'BODY')
  const footer = components.find((c: any) => c.type === 'FOOTER')
  const buttonsComp = components.find((c: any) => c.type === 'BUTTONS')
  const buttons: any[] = buttonsComp?.buttons || []

  // Substitui {{1}}, {{2}}... por valores de exemplo
  const corpo = (body?.text || '').replace(/\{\{(\d+)\}\}/g, (_m: string, n: string) =>
    EXEMPLO_VARS[Number(n)] || `exemplo ${n}`,
  )

  const headerImagem = header?.format === 'IMAGE'
  const headerTexto = header?.format === 'TEXT' ? header?.text : ''

  // Renderiza **negrito** simples do WhatsApp
  const renderTexto = (texto: string) =>
    texto.split(/(\*[^*]+\*)/g).map((parte, i) =>
      parte.startsWith('*') && parte.endsWith('*') && parte.length > 1
        ? <strong key={i}>{parte.slice(1, -1)}</strong>
        : <span key={i}>{parte}</span>,
    )

  return (
    <div>
      <div className="text-xs font-bold text-gray-600 mb-1">Pré-visualização (como o cliente vê)</div>
      <div
        className="rounded-lg p-4"
        style={{
          background: '#E5DDD5',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'%23E5DDD5\'/%3E%3C/svg%3E")',
          border: '1px solid #E0DDD8',
        }}
      >
        <div
          className="max-w-[85%] rounded-lg shadow-sm overflow-hidden"
          style={{ background: '#FFFFFF' }}
        >
          {headerImagem && (
            headerImageUrl ? (
              <img src={headerImageUrl} alt="cabeçalho" className="w-full max-h-48 object-cover" />
            ) : (
              <div className="w-full h-32 flex items-center justify-center text-xs text-gray-400" style={{ background: '#D1D7DB' }}>
                🖼 imagem do cabeçalho
              </div>
            )
          )}
          <div className="p-2.5">
            {headerTexto && (
              <div className="font-bold text-sm text-gray-900 mb-1">{renderTexto(headerTexto)}</div>
            )}
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-snug">
              {renderTexto(corpo)}
            </div>
            {footer?.text && (
              <div className="text-[11px] text-gray-400 mt-1.5">{footer.text}</div>
            )}
            <div className="text-[10px] text-gray-400 text-right mt-0.5">12:00</div>
          </div>
          {buttons.length > 0 && (
            <div style={{ borderTop: '1px solid #F0F0F0' }}>
              {buttons.map((b, i) => (
                <div
                  key={i}
                  className="text-center text-sm font-medium py-2"
                  style={{ color: '#00A5F4', borderTop: i > 0 ? '1px solid #F0F0F0' : 'none' }}
                >
                  {b.type === 'URL' ? '🔗 ' : b.type === 'PHONE_NUMBER' ? '📞 ' : ''}{b.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-[10px] text-gray-500 mt-1">
        Variáveis preenchidas com valores de exemplo. No envio, são substituídas pelos dados reais de cada lead.
      </p>
    </div>
  )
}
