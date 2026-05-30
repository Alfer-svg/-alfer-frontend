import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { Modal } from '../components/Modal'
import {
  UserPlus, Search, Tag, Phone, Mail, Instagram, X,
  Pencil, Trash2, AlertCircle, CheckCircle2, RefreshCcw, Loader2, Upload, TrendingUp,
  BellOff, BellRing,
} from 'lucide-react'

// Leva inicial de construtoras mapeadas (RMR + Suape) — formato: Empresa | Telefone | Observação
const CONSTRUTORAS_MAPEADAS = `Moura Dubeux | (81) 3087-8000 | Pina/Boa Viagem — maior do NE, alto volume de obras
Pernambuco Construtora | (81) 3125-6464 | Pina — incorporação + obras industriais
Construtora Carajás | (81) 3228-5555 | Cordeiro — obras na RMR
HBR Engenharia | (81) 3229-1788 | Prado — construção civil
Construtora Santo Antônio | (81) 3466-1485 | Boa Viagem — predial
Boa Vista Construtora e Incorporadora | (81) 3366-1438 | Ilha do Leite — incorporação
Construtora Sam | (81) 3224-2136 | Recife centro — construção civil`

type StatusLead = 'NOVO' | 'QUALIFICADO' | 'PROPOSTA' | 'CONVERTIDO' | 'PERDIDO'
type OrigemLead = 'BREVO' | 'MANUAL' | 'SITE' | 'WHATSAPP' | 'INDICACAO' | 'INSTAGRAM' | 'FACEBOOK' | 'GOOGLE' | 'TELEFONE' | 'EMAIL' | 'EVENTO' | 'PASSANTE' | 'OUTRO'

type Lead = {
  id: string
  nome: string | null
  email: string | null
  telefone: string | null
  empresa: string | null
  cargo: string | null
  instagram: string | null
  origem: OrigemLead
  status: StatusLead
  tags: string[]
  observacoes: string | null
  optOutMarketing?: boolean
  optOutEm?: string | null
  ultimoContatoEm: string | null
  convertidoEm: string | null
  clienteId: string | null
  externalId: string | null
  importadoEm: string | null
  createdAt: string
  updatedAt: string
}

const STATUS_COLORS: Record<StatusLead, { bg: string; text: string; border: string }> = {
  NOVO:        { bg: '#FEF3E2', text: '#B45309', border: '#FCD34D' },
  QUALIFICADO: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  PROPOSTA:    { bg: '#FCE7F3', text: '#9D174D', border: '#F9A8D4' },
  CONVERTIDO:  { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  PERDIDO:     { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
}

const ORIGENS: OrigemLead[] = ['BREVO', 'MANUAL', 'SITE', 'WHATSAPP', 'INSTAGRAM', 'INDICACAO', 'FACEBOOK', 'GOOGLE', 'TELEFONE', 'EMAIL', 'EVENTO', 'PASSANTE', 'OUTRO']

export default function Leads() {
  const [itens, setItens] = useState<Lead[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusLead | ''>('')
  const [filtroOrigem, setFiltroOrigem] = useState<OrigemLead | ''>('')
  const [filtroTag, setFiltroTag] = useState('')
  const [resumo, setResumo] = useState<any>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const [editando, setEditando] = useState<Lead | null>(null)
  const [criando, setCriando] = useState(false)
  const [importando, setImportando] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const params: any = { limite: 500 }
      if (busca) params.busca = busca
      if (filtroStatus) params.status = filtroStatus
      if (filtroOrigem) params.origem = filtroOrigem
      if (filtroTag) params.tag = filtroTag
      const [r1, r2] = await Promise.all([
        api.get('/leads', { params }),
        api.get('/leads/resumo'),
      ])
      setItens(r1.data)
      setResumo(r2.data)
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao carregar leads')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [filtroStatus, filtroOrigem, filtroTag])

  const tagsUnicas = useMemo(() => {
    const set = new Set<string>()
    itens.forEach((l) => l.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [itens])

  const salvarEdicao = async (dto: Partial<Lead>) => {
    setErro(null)
    try {
      if (editando) {
        await api.put(`/leads/${editando.id}`, dto)
        setSucesso('Lead atualizado')
      } else {
        await api.post('/leads', dto)
        setSucesso('Lead criado')
      }
      setEditando(null)
      setCriando(false)
      carregar()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao salvar')
    }
  }

  const [enviandoCrm, setEnviandoCrm] = useState<string | null>(null)
  const mandarProCrm = async (l: Lead) => {
    const nome = l.empresa || l.nome || l.email || l.telefone || 'Oportunidade'
    if (!confirm(`Criar oportunidade no CRM pra "${nome}"?`)) return
    setEnviandoCrm(l.id)
    setErro(null)
    try {
      const descricao = [l.observacoes, l.tags.length ? `Tags: ${l.tags.join(', ')}` : '']
        .filter(Boolean).join('\n')
      await api.post('/crm/oportunidades', {
        titulo: nome,
        descricao: descricao || null,
        prospectNome: l.nome || null,
        prospectEmpresa: l.empresa || null,
        prospectTelefone: l.telefone || null,
        prospectEmail: l.email || null,
        origem: l.origem,
        estagio: 'NOVO',
      })
      // Lead entrou no pipeline → marca como qualificado
      if (l.status === 'NOVO') await api.put(`/leads/${l.id}`, { status: 'QUALIFICADO' })
      setSucesso(`"${nome}" enviado pro CRM`)
      carregar()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao enviar pro CRM')
    } finally {
      setEnviandoCrm(null)
    }
  }

  const deletar = async (l: Lead) => {
    if (!confirm(`Deletar lead "${l.nome || l.email || l.telefone}"?`)) return
    try {
      await api.post(`/leads/${l.id}/deletar`)
      setSucesso('Lead removido')
      carregar()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao deletar')
    }
  }

  const toggleOptOut = async (l: Lead) => {
    const novo = !l.optOutMarketing
    if (novo && !confirm(`Descadastrar "${l.nome || l.empresa || l.telefone}" das campanhas?\n\nNão vai mais receber disparos de marketing até ser reativado.`)) return
    try {
      await api.post(`/leads/${l.id}/opt-out`, { optOut: novo })
      setSucesso(novo ? 'Lead descadastrado das campanhas' : 'Lead reativado nas campanhas')
      carregar()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao atualizar')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Leads <span className="text-gray-400 font-normal text-base">({resumo?.totalGeral || 0})</span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setImportando(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-900"
            style={{ background: '#FFAF06' }}
          >
            <Upload className="w-4 h-4" />
            Importar lista
          </button>
          <button
            onClick={() => setCriando(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-900 text-white"
          >
            <UserPlus className="w-4 h-4" />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {resumo.porStatus.map((s: any) => (
            <button
              key={s.status}
              onClick={() => setFiltroStatus(filtroStatus === s.status ? '' : s.status)}
              className={`p-3 rounded-lg text-left transition-all ${filtroStatus === s.status ? 'ring-2 ring-amber-400' : ''}`}
              style={{
                background: STATUS_COLORS[s.status as StatusLead]?.bg || '#F1EFE8',
                border: `1px solid ${STATUS_COLORS[s.status as StatusLead]?.border || '#E0DDD8'}`,
              }}
            >
              <div className="text-xs font-semibold" style={{ color: STATUS_COLORS[s.status as StatusLead]?.text }}>
                {s.status}
              </div>
              <div className="text-xl font-bold" style={{ color: STATUS_COLORS[s.status as StatusLead]?.text }}>
                {s.qtd}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: '#FAFAF8', border: '1px solid #F1EFE8' }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregar()}
            placeholder="Buscar nome, email, telefone, empresa, instagram..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none bg-white"
            style={{ border: '1px solid #E0DDD8' }}
          />
        </div>
        <select
          value={filtroOrigem}
          onChange={(e) => setFiltroOrigem(e.target.value as any)}
          className="px-3 py-2 text-sm rounded-lg bg-white outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todas origens</option>
          {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        {tagsUnicas.length > 0 && (
          <select
            value={filtroTag}
            onChange={(e) => setFiltroTag(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-white outline-none"
            style={{ border: '1px solid #E0DDD8' }}
          >
            <option value="">Todas tags</option>
            {tagsUnicas.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <button
          onClick={carregar}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-white"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <RefreshCcw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {erro && (
        <div className="mb-3 p-3 rounded-lg flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {erro}
          <button onClick={() => setErro(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {sucesso && (
        <div className="mb-3 p-3 rounded-lg flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {sucesso}
          <button onClick={() => setSucesso(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Lista */}
      {carregando ? (
        <div className="text-center py-10 text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Carregando...
        </div>
      ) : itens.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Nenhum lead encontrado</div>
      ) : (
        <div className="grid gap-2">
          {itens.map((l) => (
            <div key={l.id} className="p-3 rounded-xl bg-white" style={{ border: '1px solid #F1EFE8' }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{l.nome || '(sem nome)'}</span>
                    {l.empresa && <span className="text-sm text-gray-500">· {l.empresa}</span>}
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: STATUS_COLORS[l.status]?.bg,
                        color: STATUS_COLORS[l.status]?.text,
                      }}
                    >
                      {l.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {l.origem}
                    </span>
                    {l.optOutMarketing && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                        <BellOff className="w-3 h-3" /> Descadastrado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 flex-wrap">
                    {l.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {l.email}
                      </span>
                    )}
                    {l.telefone && (
                      <a
                        href={`https://wa.me/${l.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 hover:text-emerald-600"
                      >
                        <Phone className="w-3 h-3" /> {l.telefone}
                      </a>
                    )}
                    {l.instagram && (
                      <a
                        href={`https://instagram.com/${l.instagram}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 hover:text-pink-600"
                      >
                        <Instagram className="w-3 h-3" /> {l.instagram}
                      </a>
                    )}
                  </div>
                  {l.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <Tag className="w-3 h-3 text-gray-400" />
                      {l.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => mandarProCrm(l)}
                    disabled={enviandoCrm === l.id}
                    className="p-1.5 rounded hover:bg-amber-50 disabled:opacity-50"
                    title="Enviar pro CRM"
                  >
                    {enviandoCrm === l.id
                      ? <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                      : <TrendingUp className="w-4 h-4 text-amber-600" />}
                  </button>
                  <button
                    onClick={() => toggleOptOut(l)}
                    className={`p-1.5 rounded ${l.optOutMarketing ? 'hover:bg-emerald-50' : 'hover:bg-red-50'}`}
                    title={l.optOutMarketing ? 'Reativar nas campanhas' : 'Descadastrar das campanhas'}
                  >
                    {l.optOutMarketing
                      ? <BellRing className="w-4 h-4 text-emerald-600" />
                      : <BellOff className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => setEditando(l)}
                    className="p-1.5 rounded hover:bg-gray-100"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => deletar(l)}
                    className="p-1.5 rounded hover:bg-red-50"
                    title="Deletar"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: criar/editar */}
      {(criando || editando) && (
        <FormModal
          lead={editando}
          onClose={() => { setCriando(false); setEditando(null) }}
          onSave={salvarEdicao}
          tagsExistentes={tagsUnicas}
        />
      )}

      {/* Modal: importar lista */}
      {importando && (
        <ImportarModal
          onClose={() => setImportando(false)}
          onDone={(msg) => { setImportando(false); setSucesso(msg); carregar() }}
        />
      )}

    </div>
  )
}

function ImportarModal({ onClose, onDone }: { onClose: () => void; onDone: (msg: string) => void }) {
  const [texto, setTexto] = useState('')
  const [tags, setTags] = useState('CONSTRUTORA, CAÇAMBA')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const parsear = () => {
    const tagsArr = tags.split(',').map((t) => t.trim()).filter(Boolean)
    return texto
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((linha) => {
        const [empresa, telefone, observacoes] = linha.split('|').map((p) => p.trim())
        return {
          nome: empresa || null,
          empresa: empresa || null,
          telefone: telefone || null,
          observacoes: observacoes || null,
          tags: tagsArr,
          origem: 'TELEFONE',
          status: 'NOVO',
        }
      })
      .filter((l) => l.empresa)
  }

  const importar = async () => {
    const leads = parsear()
    if (leads.length === 0) return setErro('Cole pelo menos uma linha (Empresa | Telefone | Observação).')
    setLoading(true)
    setErro('')
    try {
      const r = await api.post('/leads/importar', { leads })
      const { criados, ignorados, erros } = r.data
      let msg = `${criados} lead(s) importado(s)`
      if (ignorados) msg += `, ${ignorados} já existia(m)`
      if (erros?.length) msg += `, ${erros.length} com erro`
      onDone(msg)
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao importar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <h2 className="font-display text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Upload className="w-5 h-5" /> Importar lista de leads
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        Uma por linha no formato <code className="bg-gray-100 px-1 rounded">Empresa | Telefone | Observação</code>.
        Quem já existe (lead ou cliente) é ignorado automaticamente.
      </p>

      <div className="mb-3">
        <button
          type="button"
          onClick={() => setTexto(CONSTRUTORAS_MAPEADAS)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: '#FEF3E2', color: '#7B5B0F' }}
        >
          Carregar construtoras mapeadas (RMR + Suape)
        </button>
      </div>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={10}
        placeholder={'Construtora X | (81) 99999-9999 | Boa Viagem\nConstrutora Y | (81) 3333-3333 | Suape'}
        className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none font-mono"
        style={{ border: '1px solid #E0DDD8' }}
      />

      <div className="mt-3">
        <label className="block text-xs font-bold text-gray-600 mb-1">Tags (aplicadas a todos)</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        />
      </div>

      {erro && <div className="mt-3 p-2 rounded-lg text-xs text-red-700 bg-red-50 border border-red-200">{erro}</div>}

      <div className="flex gap-2 pt-4">
        <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700">Cancelar</button>
        <button
          onClick={importar}
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-lg font-bold text-gray-900 disabled:opacity-50"
          style={{ background: '#FFAF06' }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin inline mr-2" />}
          Importar
        </button>
      </div>
    </Modal>
  )
}

// Tags sugeridas pra Alfer — vendedor pode usar pra agrupar leads
const TAGS_SUGERIDAS = [
  // Segmento
  'Construtora', 'Indústria', 'Saneamento', 'Energia', 'Agronegócio',
  'Mineração', 'Eventos', 'Logística', 'Comércio',
  // Interesse
  'Caçamba', 'Container Seco', 'Container Reefer', 'Munck', 'Poliguindaste',
  // Temperatura
  '🔥 Quente', '🌤️ Morno', '❄️ Frio', '⭐ Cliente Ativo',
]

function FormModal({ lead, onClose, onSave, tagsExistentes }: { lead: Lead | null; onClose: () => void; onSave: (dto: any) => void; tagsExistentes: string[] }) {
  const [nome, setNome] = useState(lead?.nome || '')
  const [email, setEmail] = useState(lead?.email || '')
  const [telefone, setTelefone] = useState(lead?.telefone || '')
  const [empresa, setEmpresa] = useState(lead?.empresa || '')
  const [cargo, setCargo] = useState(lead?.cargo || '')
  const [instagram, setInstagram] = useState(lead?.instagram || '')
  const [status, setStatus] = useState<StatusLead>(lead?.status || 'NOVO')
  const [origem, setOrigem] = useState<OrigemLead>(lead?.origem || 'MANUAL')
  const [observacoes, setObservacoes] = useState(lead?.observacoes || '')
  const [tags, setTags] = useState<string[]>(lead?.tags || [])

  const submit = (e: any) => {
    e.preventDefault()
    onSave({
      nome: nome || null,
      email: email || null,
      telefone: telefone || null,
      empresa: empresa || null,
      cargo: cargo || null,
      instagram: instagram || null,
      status,
      origem,
      observacoes: observacoes || null,
      tags,
    })
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-display text-lg font-bold text-gray-900 mb-3">
        {lead ? 'Editar Lead' : 'Novo Lead'}
      </h2>
      <form onSubmit={submit} className="space-y-2">
        <Input label="Nome" value={nome} onChange={setNome} />
        <Input label="Email" value={email} onChange={setEmail} type="email" />
        <Input label="Telefone (+55...)" value={telefone} onChange={setTelefone} />
        <Input label="Empresa" value={empresa} onChange={setEmpresa} />
        <Input label="Cargo" value={cargo} onChange={setCargo} />
        <Input label="Instagram" value={instagram} onChange={setInstagram} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none" style={{ border: '1px solid #E0DDD8' }}>
              {(['NOVO', 'QUALIFICADO', 'PROPOSTA', 'CONVERTIDO', 'PERDIDO'] as StatusLead[]).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Origem</label>
            <select value={origem} onChange={(e) => setOrigem(e.target.value as any)} className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none" style={{ border: '1px solid #E0DDD8' }}>
              {ORIGENS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <TagsEditor value={tags} onChange={setTags} sugestoes={Array.from(new Set([...TAGS_SUGERIDAS, ...tagsExistentes]))} />
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Observações</label>
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none" style={{ border: '1px solid #E0DDD8' }} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700">
            Cancelar
          </button>
          <button type="submit" className="flex-1 px-4 py-2 rounded-lg font-bold text-white" style={{ background: '#FFAF06', color: '#7B5B0F' }}>
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  )
}

function TagsEditor({ value, onChange, sugestoes }: { value: string[]; onChange: (v: string[]) => void; sugestoes: string[] }) {
  const [input, setInput] = useState('')

  const adicionar = (tag: string) => {
    const t = tag.trim()
    if (!t || value.includes(t)) return
    onChange([...value, t])
    setInput('')
  }
  const remover = (tag: string) => onChange(value.filter((x) => x !== tag))

  const matchSugestoes = sugestoes.filter(
    (s) => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase()),
  ).slice(0, 12)

  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">Tags</label>

      {/* Chips das tags já selecionadas */}
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {value.length === 0 && (
          <span className="text-xs text-gray-400 italic">Nenhuma tag · escolha abaixo ou digite</span>
        )}
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: '#FFAF06', color: '#1F2937' }}
          >
            {tag}
            <button
              type="button"
              onClick={() => remover(tag)}
              className="hover:bg-black/10 rounded-full p-0.5"
              aria-label={`Remover ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Input pra adicionar nova (Enter ou , confirma) */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            adicionar(input)
          } else if (e.key === 'Backspace' && !input && value.length > 0) {
            // backspace com input vazio remove a última tag
            remover(value[value.length - 1])
          }
        }}
        placeholder="Digite uma tag e Enter pra adicionar"
        className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none"
        style={{ border: '1px solid #E0DDD8' }}
      />

      {/* Sugestões clicáveis */}
      {matchSugestoes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {matchSugestoes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => adicionar(s)}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm bg-white outline-none"
        style={{ border: '1px solid #E0DDD8' }}
      />
    </div>
  )
}
