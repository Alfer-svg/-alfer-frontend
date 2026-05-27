import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { Modal } from '../components/Modal'
import {
  UserPlus, Download, Search, Tag, Phone, Mail, Instagram, X,
  Pencil, Trash2, AlertCircle, CheckCircle2, Filter, RefreshCcw, Loader2,
} from 'lucide-react'

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
  const [dryRunResult, setDryRunResult] = useState<any>(null)
  const [executandoImport, setExecutandoImport] = useState(false)

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

  // ─── Importação Brevo ───
  const fazerDryRun = async () => {
    setExecutandoImport(true)
    setErro(null)
    try {
      const r = await api.post('/leads/importar-brevo', { dryRun: true })
      setDryRunResult(r.data)
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro no dry-run')
    } finally {
      setExecutandoImport(false)
    }
  }

  const executarImport = async () => {
    if (!confirm(`Importar ${dryRunResult?.paraCriar} leads do Brevo agora?`)) return
    setExecutandoImport(true)
    setErro(null)
    try {
      const r = await api.post('/leads/importar-brevo', { dryRun: false })
      setSucesso(`${r.data.criados} leads importados!`)
      setDryRunResult(null)
      setImportando(false)
      carregar()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro na importação')
    } finally {
      setExecutandoImport(false)
    }
  }

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Leads <span className="text-gray-400 font-normal text-base">({resumo?.totalGeral || 0})</span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setImportando(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#FFAF06', color: '#7B5B0F' }}
          >
            <Download className="w-4 h-4" />
            Importar Brevo
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
        />
      )}

      {/* Modal: importar Brevo */}
      {importando && (
        <Modal onClose={() => { setImportando(false); setDryRunResult(null) }}>
          <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
            <Download className="w-5 h-5" /> Importar contatos do Brevo
          </h2>
          {!dryRunResult ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Vai puxar todos os contatos do Brevo, ignorar os sujos (sem email/whatsapp),
                e pular quem já existe como Lead ou Cliente. Roda um preview antes.
              </p>
              <button
                onClick={fazerDryRun}
                disabled={executandoImport}
                className="w-full px-4 py-3 rounded-lg font-semibold disabled:opacity-50"
                style={{ background: '#FFAF06', color: '#7B5B0F' }}
              >
                {executandoImport ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                Rodar preview (não importa nada)
              </button>
            </>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                <Linha label="Total no Brevo" valor={dryRunResult.totalBrevo} />
                <Linha label="Válidos (com email ou WhatsApp)" valor={dryRunResult.validos} cor="green" />
                <Linha label="Duplicado com Cliente (vão pular)" valor={dryRunResult.duplicadosComCliente} cor="orange" />
                <Linha label="Duplicado com Lead existente (vão pular)" valor={dryRunResult.duplicadosComLead} cor="orange" />
                <div className="h-px bg-gray-200 my-2" />
                <Linha label="✨ Vão ser criados como Lead" valor={dryRunResult.paraCriar} cor="green" bold />
              </div>
              {dryRunResult.amostra?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-gray-600 uppercase mb-1">Amostra (5 primeiros)</h3>
                  <div className="space-y-1">
                    {dryRunResult.amostra.map((a: any, i: number) => (
                      <div key={i} className="text-xs p-2 rounded bg-gray-50 border border-gray-200">
                        <strong>{a.nome || '(sem nome)'}</strong> · {a.email || '—'} · {a.telefone || '—'}
                        {a.tags?.length > 0 && <span className="text-gray-500"> · [{a.tags.join(', ')}]</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setDryRunResult(null)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={executarImport}
                  disabled={executandoImport || dryRunResult.paraCriar === 0}
                  className="flex-1 px-4 py-2 rounded-lg font-bold text-white disabled:opacity-50"
                  style={{ background: '#10B981' }}
                >
                  {executandoImport ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                  Importar {dryRunResult.paraCriar} leads
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}

function Linha({ label, valor, cor, bold }: { label: string; valor: number; cor?: 'green' | 'orange' | 'red'; bold?: boolean }) {
  const corMap: any = {
    green: 'text-emerald-700 bg-emerald-50',
    orange: 'text-amber-700 bg-amber-50',
    red: 'text-red-700 bg-red-50',
  }
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{label}</span>
      <span className={`px-2 py-1 rounded text-sm font-bold ${cor ? corMap[cor] : 'bg-gray-100 text-gray-700'}`}>
        {valor}
      </span>
    </div>
  )
}

function FormModal({ lead, onClose, onSave }: { lead: Lead | null; onClose: () => void; onSave: (dto: any) => void }) {
  const [nome, setNome] = useState(lead?.nome || '')
  const [email, setEmail] = useState(lead?.email || '')
  const [telefone, setTelefone] = useState(lead?.telefone || '')
  const [empresa, setEmpresa] = useState(lead?.empresa || '')
  const [cargo, setCargo] = useState(lead?.cargo || '')
  const [instagram, setInstagram] = useState(lead?.instagram || '')
  const [status, setStatus] = useState<StatusLead>(lead?.status || 'NOVO')
  const [origem, setOrigem] = useState<OrigemLead>(lead?.origem || 'MANUAL')
  const [observacoes, setObservacoes] = useState(lead?.observacoes || '')
  const [tagsStr, setTagsStr] = useState((lead?.tags || []).join(', '))

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
      tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
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
        <Input label="Tags (separadas por vírgula)" value={tagsStr} onChange={setTagsStr} />
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
