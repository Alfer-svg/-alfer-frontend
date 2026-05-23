import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { ArrowLeft, Plus, Pencil, Trash2, X, Loader2, AlertCircle, PowerOff, Power, FileCheck } from 'lucide-react'

export default function CondicoesOrcamento() {
  const navigate = useNavigate()
  const [condicoes, setCondicoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAtivo, setFiltroAtivo] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [erro, setErro] = useState('')

  const load = () => {
    setLoading(true)
    const params: any = {}
    if (filtroAtivo) params.ativo = filtroAtivo
    api.get('/condicoes-orcamento', { params })
      .then((r) => setCondicoes(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroAtivo])

  const alternarAtivo = async (c: any) => {
    try {
      await api.put(`/condicoes-orcamento/${c.id}`, { ativo: !c.ativo })
      load()
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao atualizar.')
    }
  }

  const excluir = async (c: any) => {
    if (!confirm(`Excluir condição "${c.texto.slice(0, 60)}..."?`)) return
    try {
      await api.delete(`/condicoes-orcamento/${c.id}`)
      load()
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao excluir.')
    }
  }

  return (
    <div className="p-8 max-w-4xl animate-fade-in">
      <button onClick={() => navigate('/orcamentos')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all">
        <ArrowLeft className="w-4 h-4" /> Voltar para orçamentos
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Condições padrão</h1>
          <p className="text-gray-500 text-sm mt-1">
            Cadastre condições que aparecem como opções selecionáveis ao criar um orçamento.
          </p>
        </div>
        <button
          onClick={() => { setEditando(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" /> Nova condição
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={filtroAtivo}
          onChange={(e) => setFiltroAtivo(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todas</option>
          <option value="true">Apenas ativas</option>
          <option value="false">Apenas inativas</option>
        </select>
      </div>

      {erro && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : condicoes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma condição cadastrada</p>
          <p className="text-xs mt-1">Cadastre frases comuns (frete, pagamento, garantia) pra reaproveitar nos orçamentos.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {condicoes.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-5 flex items-start gap-4 animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
                <FileCheck className="w-4 h-4" style={{ color: '#FFAF06' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {c.categoria && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#FEF3E2', color: '#633806' }}>{c.categoria}</span>}
                  {Array.isArray(c.tiposAplicaveis) && c.tiposAplicaveis.length > 0 ? (
                    c.tiposAplicaveis.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#E3EEFA', color: '#1A5276' }}>
                        {({ CONTAINER_SECO: 'Seco', CONTAINER_REEFER: 'Reefer', CACAMBA_ESTACIONARIA: 'Caçamba', CAMINHAO_MUNCK: 'Munck' } as Record<string, string>)[t] || t}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F1EFE8', color: '#555' }}>Todos os tipos</span>
                  )}
                  {!c.ativo && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F1EFE8', color: '#888' }}>Inativa</span>}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.texto}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => { setEditando(c); setShowForm(true) }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50" style={{ border: '1px solid #E0DDD8' }}>
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => alternarAtivo(c)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: c.ativo ? '#F1EFE8' : '#EAF3DE', color: c.ativo ? '#888' : '#27500A' }}>
                  {c.ativo ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                  {c.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => excluir(c)} title="Excluir" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50" style={{ border: '1px solid #FACACA' }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <CondicaoModal cond={editando} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); load() }} />}
    </div>
  )
}

function CondicaoModal({ cond, onClose, onSuccess }: { cond?: any; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!cond
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const tiposEquipamento = [
    { v: 'CONTAINER_SECO', l: 'Container Seco' },
    { v: 'CONTAINER_REEFER', l: 'Container Reefer' },
    { v: 'CACAMBA_ESTACIONARIA', l: 'Caçamba Estacionária' },
    { v: 'CAMINHAO_MUNCK', l: 'Caminhão Munck' },
  ]
  const [form, setForm] = useState({
    texto: cond?.texto || '',
    categoria: cond?.categoria || '',
    ordem: cond?.ordem != null ? String(cond.ordem) : '0',
  })
  const [tipos, setTipos] = useState<string[]>(Array.isArray(cond?.tiposAplicaveis) ? cond.tiposAplicaveis : [])
  const toggleTipo = (t: string) =>
    setTipos((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.texto.trim()) return setErro('Texto é obrigatório.')
    setLoading(true)
    try {
      const payload = {
        texto: form.texto.trim(),
        categoria: form.categoria || null,
        tiposAplicaveis: tipos,
        ordem: Number(form.ordem) || 0,
      }
      if (isEdit) await api.put(`/condicoes-orcamento/${cond.id}`, payload)
      else await api.post('/condicoes-orcamento', payload)
      onSuccess()
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao salvar.')
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">{isEdit ? 'Editar condição' : 'Nova condição'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Categoria (opcional)</label>
            <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Frete, Pagamento, Garantia..." className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Texto da condição *</label>
            <textarea value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} required rows={4} placeholder="Ex: Pagamento em até 30 dias da emissão da nota fiscal." className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">Tipos de equipamento aplicáveis</label>
            <div className="grid grid-cols-2 gap-2">
              {tiposEquipamento.map((t) => {
                const sel = tipos.includes(t.v)
                return (
                  <button
                    key={t.v}
                    type="button"
                    onClick={() => toggleTipo(t.v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all"
                    style={{
                      background: sel ? '#FFF8E6' : '#F9F7F4',
                      color: sel ? '#1A1C1E' : '#888',
                      border: sel ? '2px solid #FFAF06' : '2px solid transparent',
                    }}
                  >
                    <input type="checkbox" checked={sel} readOnly className="w-3.5 h-3.5" style={{ accentColor: '#FFAF06' }} />
                    {t.l}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {tipos.length === 0 ? '⚠ Nenhum selecionado = aplica a TODOS os tipos' : `Aplica a ${tipos.length} tipo(s)`}
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ordem de exibição</label>
            <input value={form.ordem} onChange={(e) => setForm({ ...form, ordem: e.target.value })} type="number" className={inputCls} style={inputStyle} />
          </div>
          {erro && (<div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>)}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
    </Modal>
  )
}
