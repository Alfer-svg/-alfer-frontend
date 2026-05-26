import { useEffect, useState, FormEvent, DragEvent } from 'react'
import api from '../services/api'
import { Modal } from '../components/Modal'
import {
  TrendingUp, Plus, AlertCircle, Loader2, X, Building2, Phone, Mail, Calendar,
  MessageSquare, DollarSign, FileText, Trash2, Pencil, Award, XCircle, ArrowRight,
} from 'lucide-react'

const ESTAGIOS = [
  { v: 'NOVO',         l: 'Lead novo',       bg: '#E3EEFA', text: '#1A5276' },
  { v: 'QUALIFICADO',  l: 'Qualificado',     bg: '#FEF3E2', text: '#633806' },
  { v: 'PROPOSTA',     l: 'Em proposta',     bg: '#FFF8E6', text: '#5C4500' },
  { v: 'NEGOCIACAO',   l: 'Negociação',      bg: '#FAEDCD', text: '#A0680E' },
  { v: 'GANHO',        l: '✓ Ganho',         bg: '#EAF3DE', text: '#27500A' },
  { v: 'PERDIDO',      l: '✗ Perdido',       bg: '#FDEEEE', text: '#8B0000' },
]

const ORIGENS = [
  { v: '',          l: '—' },
  { v: 'INDICACAO', l: 'Indicação' },
  { v: 'INSTAGRAM', l: 'Instagram' },
  { v: 'FACEBOOK',  l: 'Facebook' },
  { v: 'GOOGLE',    l: 'Google' },
  { v: 'WHATSAPP',  l: 'WhatsApp' },
  { v: 'TELEFONE',  l: 'Telefone' },
  { v: 'EMAIL',     l: 'E-mail' },
  { v: 'SITE',      l: 'Site' },
  { v: 'EVENTO',    l: 'Evento' },
  { v: 'PASSANTE',  l: 'Passante' },
  { v: 'OUTRO',     l: 'Outro' },
]

const TIPOS_INTERACAO = [
  { v: 'ANOTACAO',         l: '📝 Anotação' },
  { v: 'LIGACAO',          l: '📞 Ligação' },
  { v: 'WHATSAPP',         l: '💬 WhatsApp' },
  { v: 'EMAIL',            l: '✉ E-mail' },
  { v: 'REUNIAO',          l: '👥 Reunião' },
  { v: 'VISITA',           l: '🏢 Visita' },
  { v: 'PROPOSTA_ENVIADA', l: '📄 Proposta enviada' },
  { v: 'OUTRO',            l: 'Outro' },
]

const fmtBRL = (v?: number | null) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
import { fmtDate } from '../utils/data'

function diasAte(d?: string | null) {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

export default function CRM() {
  const [data, setData] = useState<{ colunas: Record<string, any[]>; stats: Record<string, { count: number; valor: number }> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalNova, setModalNova] = useState(false)
  const [modalDetalhe, setModalDetalhe] = useState<any | null>(null)
  const [erro, setErro] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    api.get('/crm/kanban').then((r) => setData(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDrop = async (e: DragEvent, novoEstagio: string) => {
    e.preventDefault()
    if (!dragId) return
    setDragId(null)
    try {
      await api.put(`/crm/oportunidades/${dragId}/mover`, { estagio: novoEstagio, ordem: 0 })
      load()
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao mover')
    }
  }

  if (loading || !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">CRM — Pipeline</h1>
          <p className="text-gray-500 text-sm mt-1">Arraste cards entre colunas pra mover entre estágios</p>
        </div>
        <button
          onClick={() => setModalNova(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-900 hover:opacity-90"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" /> Nova oportunidade
        </button>
      </div>

      {erro && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {ESTAGIOS.map((est) => {
            const items = data.colunas[est.v] || []
            const stats = data.stats[est.v] || { count: 0, valor: 0 }
            return (
              <div
                key={est.v}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, est.v)}
                className="w-72 flex-shrink-0 rounded-2xl p-3 flex flex-col"
                style={{ background: est.bg, minHeight: 400 }}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: est.text }}>{est.l}</div>
                    <div className="text-xs" style={{ color: est.text, opacity: 0.7 }}>
                      {stats.count} • {fmtBRL(stats.valor)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  {items.map((op) => (
                    <CardOportunidade
                      key={op.id}
                      op={op}
                      onClick={() => setModalDetalhe(op)}
                      onDragStart={() => setDragId(op.id)}
                      onDragEnd={() => setDragId(null)}
                      isDragging={dragId === op.id}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-xs opacity-50 py-8" style={{ color: est.text }}>
                      Solte um card aqui
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {modalNova && (
        <OportunidadeModal
          op={null}
          onClose={() => setModalNova(false)}
          onSaved={() => { setModalNova(false); load() }}
        />
      )}
      {modalDetalhe && (
        <DetalheModal
          opId={modalDetalhe.id}
          onClose={() => setModalDetalhe(null)}
          onChanged={() => load()}
        />
      )}
    </div>
  )
}

function CardOportunidade({ op, onClick, onDragStart, onDragEnd, isDragging }: any) {
  const cliente = op.cliente?.razaoSocial || op.prospectEmpresa || op.prospectNome || '—'
  const dias = diasAte(op.dtProximaAcao)
  const corAcao = dias == null ? '#888' : dias < 0 ? '#8B0000' : dias === 0 ? '#8B0000' : dias <= 3 ? '#A77400' : '#27500A'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-md transition-all"
      style={{
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div className="text-sm font-semibold text-gray-900 mb-1.5">{op.titulo}</div>
      <div className="text-xs text-gray-600 mb-2 truncate">{cliente}</div>
      {op.valorEstimado != null && (
        <div className="text-sm font-bold mb-2" style={{ color: '#27500A' }}>
          {fmtBRL(op.valorEstimado)}
        </div>
      )}
      {op.proximaAcao && (
        <div className="text-xs flex items-center gap-1 mb-1" style={{ color: corAcao }}>
          <Calendar className="w-3 h-3" />
          <span className="truncate">{op.proximaAcao}</span>
        </div>
      )}
      {op.dtProximaAcao && (
        <div className="text-[10px]" style={{ color: corAcao }}>
          {dias! < 0 ? `Atrasado ${Math.abs(dias!)}d` : dias === 0 ? 'HOJE' : `Em ${dias}d`}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {op.origem && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#F1EFE8', color: '#666' }}>
            {ORIGENS.find((o) => o.v === op.origem)?.l || op.origem}
          </span>
        )}
        {op._count?.interacoes > 0 && (
          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
            <MessageSquare className="w-3 h-3" /> {op._count.interacoes}
          </span>
        )}
        {op.orcamentoId && (
          <span className="text-[10px] text-orange-700 flex items-center gap-0.5">
            <FileText className="w-3 h-3" /> Orç
          </span>
        )}
      </div>
    </div>
  )
}

function OportunidadeModal({ op, onClose, onSaved }: { op: any | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!op?.id
  const [clientes, setClientes] = useState<any[]>([])
  const [form, setForm] = useState({
    titulo: op?.titulo || '',
    descricao: op?.descricao || '',
    clienteId: op?.clienteId || '',
    prospectNome: op?.prospectNome || '',
    prospectTelefone: op?.prospectTelefone || '',
    prospectEmail: op?.prospectEmail || '',
    prospectEmpresa: op?.prospectEmpresa || '',
    valorEstimado: op?.valorEstimado != null ? String(op.valorEstimado) : '',
    probabilidade: op?.probabilidade != null ? String(op.probabilidade) : '',
    estagio: op?.estagio || 'NOVO',
    origem: op?.origem || '',
    responsavel: op?.responsavel || '',
    dtFechamentoPrevisto: op?.dtFechamentoPrevisto ? new Date(op.dtFechamentoPrevisto).toISOString().slice(0, 10) : '',
    proximaAcao: op?.proximaAcao || '',
    dtProximaAcao: op?.dtProximaAcao ? new Date(op.dtProximaAcao).toISOString().slice(0, 10) : '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => { api.get('/clientes').then((r) => setClientes(r.data)) }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.titulo) return setErro('Título é obrigatório.')
    setLoading(true); setErro('')
    try {
      const payload = {
        ...form,
        clienteId: form.clienteId || null,
        origem: form.origem || null,
      }
      if (isEdit) await api.put(`/crm/oportunidades/${op.id}`, payload)
      else await api.post('/crm/oportunidades', payload)
      onSaved()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">{isEdit ? 'Editar' : 'Nova'} oportunidade</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Título *</label>
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required placeholder="Ex: 5 containers — obra Suape" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Descrição</label>
          <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Cliente cadastrado</label>
          <select value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} className={inputCls} style={inputStyle}>
            <option value="">— prospect novo (preenche abaixo) —</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.razaoSocial}</option>)}
          </select>
        </div>
        {!form.clienteId && (
          <div className="p-3 rounded-xl space-y-3" style={{ background: '#F9F7F4', border: '1px solid #E0DDD8' }}>
            <div className="text-xs text-gray-500 font-medium">Dados do prospect (ainda não cadastrado):</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome</label>
                <input value={form.prospectNome} onChange={(e) => setForm({ ...form, prospectNome: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Empresa</label>
                <input value={form.prospectEmpresa} onChange={(e) => setForm({ ...form, prospectEmpresa: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                <input value={form.prospectTelefone} onChange={(e) => setForm({ ...form, prospectTelefone: e.target.value })} placeholder="(81) 9 9999-9999" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">E-mail</label>
                <input type="email" value={form.prospectEmail} onChange={(e) => setForm({ ...form, prospectEmail: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Valor estimado (R$)</label>
            <input type="number" step="0.01" min="0" value={form.valorEstimado} onChange={(e) => setForm({ ...form, valorEstimado: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Probabilidade (%)</label>
            <input type="number" min="0" max="100" value={form.probabilidade} onChange={(e) => setForm({ ...form, probabilidade: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Estágio</label>
            <select value={form.estagio} onChange={(e) => setForm({ ...form, estagio: e.target.value })} className={inputCls} style={inputStyle}>
              {ESTAGIOS.map((est) => <option key={est.v} value={est.v}>{est.l}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Origem</label>
            <select value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} className={inputCls} style={inputStyle}>
              {ORIGENS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Responsável</label>
            <input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do vendedor" className={inputCls} style={inputStyle} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Próxima ação</label>
            <input value={form.proximaAcao} onChange={(e) => setForm({ ...form, proximaAcao: e.target.value })} placeholder="Ex: Ligar e confirmar interesse" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data próxima ação</label>
            <input type="date" value={form.dtProximaAcao} onChange={(e) => setForm({ ...form, dtProximaAcao: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Previsão de fechamento</label>
          <input type="date" value={form.dtFechamentoPrevisto} onChange={(e) => setForm({ ...form, dtFechamentoPrevisto: e.target.value })} className={inputCls} style={inputStyle} />
        </div>

        {erro && <div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function DetalheModal({ opId, onClose, onChanged }: { opId: string; onClose: () => void; onChanged: () => void }) {
  const [op, setOp] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [editandoOp, setEditandoOp] = useState(false)
  const [novaInt, setNovaInt] = useState({ tipo: 'ANOTACAO', descricao: '' })
  const [gerandoOrc, setGerandoOrc] = useState(false)

  const load = () => {
    setLoading(true)
    api.get(`/crm/oportunidades/${opId}`).then((r) => setOp(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [opId])

  const addInteracao = async (e: FormEvent) => {
    e.preventDefault()
    if (!novaInt.descricao) return
    try {
      await api.post(`/crm/oportunidades/${opId}/interacoes`, novaInt)
      setNovaInt({ tipo: 'ANOTACAO', descricao: '' })
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao registrar interação')
    }
  }

  const removerInteracao = async (id: string) => {
    if (!confirm('Excluir esta interação?')) return
    try {
      await api.delete(`/crm/interacoes/${id}`)
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro')
    }
  }

  const gerarOrcamento = async () => {
    setGerandoOrc(true); setErro('')
    try {
      const r = await api.post(`/crm/oportunidades/${opId}/gerar-orcamento`)
      alert(`✓ Orçamento ${r.data.numero} criado como RASCUNHO`)
      onChanged()
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao gerar orçamento')
    } finally {
      setGerandoOrc(false)
    }
  }

  const moverPra = async (estagio: string) => {
    let motivoPerda = ''
    if (estagio === 'PERDIDO') {
      const m = prompt('Motivo da perda:')
      if (m === null) return
      motivoPerda = m
    }
    try {
      await api.put(`/crm/oportunidades/${opId}/mover`, { estagio, ordem: 0 })
      if (motivoPerda) await api.put(`/crm/oportunidades/${opId}`, { motivoPerda })
      onChanged()
      load()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro ao mover')
    }
  }

  const excluir = async () => {
    if (!confirm('Excluir esta oportunidade? Não dá pra desfazer.')) return
    try {
      await api.delete(`/crm/oportunidades/${opId}`)
      onChanged()
      onClose()
    } catch (e: any) {
      setErro(e.response?.data?.message || 'Erro')
    }
  }

  if (loading || !op) return (
    <Modal onClose={onClose} maxWidth="max-w-3xl">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    </Modal>
  )

  if (editandoOp) {
    return (
      <OportunidadeModal
        op={op}
        onClose={() => setEditandoOp(false)}
        onSaved={() => { setEditandoOp(false); onChanged(); load() }}
      />
    )
  }

  const est = ESTAGIOS.find((e) => e.v === op.estagio) || ESTAGIOS[0]
  const cliente = op.cliente?.razaoSocial || op.prospectEmpresa || op.prospectNome || '—'

  return (
    <Modal onClose={onClose} maxWidth="max-w-3xl">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: est.bg, color: est.text }}>
              {est.l}
            </span>
            {op.valorEstimado != null && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#EAF3DE', color: '#27500A' }}>
                {fmtBRL(op.valorEstimado)}
              </span>
            )}
            {op.probabilidade != null && (
              <span className="text-xs text-gray-500">{op.probabilidade}% prob.</span>
            )}
          </div>
          <h2 className="font-display text-lg font-bold text-gray-900">{op.titulo}</h2>
          <p className="text-sm text-gray-600">{cliente}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setEditandoOp(true)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-50" style={{ border: '1px solid #E0DDD8' }}>
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={excluir} className="p-2 rounded-lg text-red-600 hover:bg-red-50" style={{ border: '1px solid #FACACA' }}>
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 ml-2" /></button>
        </div>
      </div>

      {erro && (
        <div className="p-3 mb-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE' }}>
          <AlertCircle className="w-4 h-4" /> {erro}
        </div>
      )}

      {/* Ações rápidas */}
      <div className="flex gap-2 flex-wrap mb-4">
        {op.estagio !== 'GANHO' && op.estagio !== 'PERDIDO' && (
          <>
            {!op.orcamentoId && (
              <button onClick={gerarOrcamento} disabled={gerandoOrc} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-900" style={{ background: '#FFF8E6', color: '#FFAF06', border: '1px solid #FFAF06' }}>
                {gerandoOrc ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                Gerar orçamento
              </button>
            )}
            <button onClick={() => moverPra('GANHO')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: '#27AE60' }}>
              <Award className="w-3 h-3" /> Marcar ganho
            </button>
            <button onClick={() => moverPra('PERDIDO')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: '#8B0000' }}>
              <XCircle className="w-3 h-3" /> Marcar perdido
            </button>
          </>
        )}
        {op.orcamentoId && (
          <a href={`/orcamentos/${op.orcamentoId}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50" style={{ border: '1px solid #E0DDD8' }}>
            <FileText className="w-3 h-3" /> Ver orçamento <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        {op.descricao && (
          <div className="col-span-2 p-3 rounded-lg" style={{ background: '#F9F7F4' }}>
            <div className="text-gray-500 mb-1">Descrição</div>
            <div className="text-gray-800">{op.descricao}</div>
          </div>
        )}
        {op.origem && (
          <div><span className="text-gray-500">Origem: </span><span className="text-gray-800">{ORIGENS.find((o) => o.v === op.origem)?.l}</span></div>
        )}
        {op.responsavel && (
          <div><span className="text-gray-500">Responsável: </span><span className="text-gray-800">{op.responsavel}</span></div>
        )}
        {op.proximaAcao && (
          <div className="col-span-2"><span className="text-gray-500">Próxima ação: </span><span className="text-gray-800">{op.proximaAcao}</span>{op.dtProximaAcao && <span className="text-gray-500"> em {fmtDate(op.dtProximaAcao)}</span>}</div>
        )}
        {op.dtFechamentoPrevisto && (
          <div><span className="text-gray-500">Fech. previsto: </span><span className="text-gray-800">{fmtDate(op.dtFechamentoPrevisto)}</span></div>
        )}
        {op.motivoPerda && (
          <div className="col-span-2 p-3 rounded-lg" style={{ background: '#FDEEEE' }}>
            <div className="text-red-700 text-xs"><strong>Motivo da perda:</strong> {op.motivoPerda}</div>
          </div>
        )}
        {!op.clienteId && (op.prospectNome || op.prospectTelefone || op.prospectEmail) && (
          <div className="col-span-2 p-3 rounded-lg" style={{ background: '#FFF8E6', border: '1px solid #FFD577' }}>
            <div className="text-xs font-medium text-gray-700 mb-1">📇 Prospect (não cadastrado)</div>
            <div className="text-xs text-gray-600 flex flex-wrap gap-3">
              {op.prospectNome && <span><Building2 className="w-3 h-3 inline" /> {op.prospectNome}</span>}
              {op.prospectTelefone && <span><Phone className="w-3 h-3 inline" /> {op.prospectTelefone}</span>}
              {op.prospectEmail && <span><Mail className="w-3 h-3 inline" /> {op.prospectEmail}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Histórico de interações */}
      <div className="border-t pt-4" style={{ borderColor: '#F1EFE8' }}>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4" /> Histórico ({op.interacoes?.length || 0})
        </h3>
        <form onSubmit={addInteracao} className="flex gap-2 mb-3">
          <select value={novaInt.tipo} onChange={(e) => setNovaInt({ ...novaInt, tipo: e.target.value })} className="px-3 py-2 rounded-xl text-sm outline-none bg-white" style={{ border: '1px solid #E0DDD8' }}>
            {TIPOS_INTERACAO.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
          <input
            value={novaInt.descricao}
            onChange={(e) => setNovaInt({ ...novaInt, descricao: e.target.value })}
            placeholder="Ex: Ligou às 14h, vai pensar até sexta"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none bg-white"
            style={{ border: '1px solid #E0DDD8' }}
          />
          <button type="submit" disabled={!novaInt.descricao} className="px-3 py-2 rounded-xl text-xs font-medium text-gray-900 disabled:opacity-50" style={{ background: '#FFAF06' }}>
            Registrar
          </button>
        </form>
        <div className="space-y-2">
          {op.interacoes?.map((i: any) => (
            <div key={i.id} className="p-3 rounded-lg flex items-start gap-3" style={{ background: '#F9F7F4' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">
                    {TIPOS_INTERACAO.find((t) => t.v === i.tipo)?.l || i.tipo}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(i.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{i.descricao}</p>
              </div>
              <button onClick={() => removerInteracao(i.id)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {!op.interacoes?.length && (
            <p className="text-xs text-gray-400 text-center py-3">Nenhuma interação registrada ainda.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
