import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { Layers3, Plus, Pencil, Trash2, X, Loader2, AlertCircle, ImagePlus } from 'lucide-react'
import { comprimirImagem } from '../utils/imagem'

const tipos = [
  { v: 'CONTAINER_SECO', l: 'Container Seco' },
  { v: 'CONTAINER_REEFER', l: 'Container Reefer' },
  { v: 'CACAMBA_ESTACIONARIA', l: 'Caçamba Estacionária' },
  { v: 'CAMINHAO_MUNCK', l: 'Caminhão Munck' },
]

const tipoLabel = (v: string) => tipos.find((t) => t.v === v)?.l || v

export default function Modelos() {
  const [modelos, setModelos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [showNovo, setShowNovo] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [erroAcao, setErroAcao] = useState('')
  const [excluindoId, setExcluindoId] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/modelos', { params: filtroTipo ? { tipo: filtroTipo } : {} })
      .then((r) => setModelos(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroTipo])

  const excluir = async (m: any) => {
    if (!confirm(`Excluir o modelo "${m.nome}"?`)) return
    setErroAcao('')
    setExcluindoId(m.id)
    try {
      await api.delete(`/modelos/${m.id}`)
      load()
    } catch (err: any) {
      setErroAcao(err.response?.data?.message || 'Erro ao excluir modelo.')
    } finally {
      setExcluindoId('')
    }
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Modelos de equipamento</h1>
          <p className="text-gray-500 text-sm mt-1">
            {modelos.length} modelo(s) cadastrado(s). Aparecem como opção ao cadastrar um equipamento.
          </p>
        </div>
        <button
          onClick={() => setShowNovo(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: '#FFAF06' }}
        >
          <Plus className="w-4 h-4" />
          Novo modelo
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-4 py-3 bg-white rounded-xl text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        >
          <option value="">Todos os tipos</option>
          {tipos.map((t) => (<option key={t.v} value={t.v}>{t.l}</option>))}
        </select>
      </div>

      {erroAcao && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erroAcao}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : modelos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Layers3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum modelo cadastrado</p>
          <p className="text-xs mt-1">Cadastre modelos pra reutilizar capacidade, descrição e foto ao criar equipamentos.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {modelos.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl p-5 flex items-center gap-4 animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {m.fotoUrl ? (
                <img src={m.fotoUrl} alt={m.nome} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" style={{ background: '#FEF3E2' }} />
              ) : (
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
                  <Layers3 className="w-5 h-5" style={{ color: '#FFAF06' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900">{m.nome}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#FEF3E2', color: '#633806' }}>
                    {tipoLabel(m.tipo)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                  {m.capacidade && <span>{m.capacidade}</span>}
                  {m.descricao && <span className="truncate max-w-md">{m.descricao}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditando(m)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                  style={{ border: '1px solid #E0DDD8' }}
                >
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button
                  onClick={() => excluir(m)}
                  disabled={excluindoId === m.id}
                  title="Excluir modelo"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  style={{ border: '1px solid #FACACA' }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNovo && <ModeloModal onClose={() => setShowNovo(false)} onSuccess={() => { setShowNovo(false); load() }} />}
      {editando && <ModeloModal modelo={editando} onClose={() => setEditando(null)} onSuccess={() => { setEditando(null); load() }} />}
    </div>
  )
}

function ModeloModal({ modelo, onClose, onSuccess }: { modelo?: any; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!modelo
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    tipo: modelo?.tipo || 'CONTAINER_SECO',
    nome: modelo?.nome || '',
    capacidade: modelo?.capacidade || '',
    descricao: modelo?.descricao || '',
    fotoUrl: modelo?.fotoUrl || '',
    valorLocacao: modelo?.valorLocacao != null ? String(modelo.valorLocacao) : '',
    tipoLocacao: modelo?.tipoLocacao || 'MENSAL',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const [processandoFoto, setProcessandoFoto] = useState(false)

  const handleFoto = async (file: File | undefined) => {
    setErro('')
    if (!file) return
    setProcessandoFoto(true)
    try {
      const dataUrl = await comprimirImagem(file)
      set('fotoUrl', dataUrl)
    } catch (err: any) {
      setErro(err?.message || 'Erro ao processar a imagem.')
    } finally {
      setProcessandoFoto(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.nome.trim()) return setErro('Nome é obrigatório.')
    setLoading(true)
    try {
      const payload = {
        tipo: form.tipo,
        nome: form.nome.trim(),
        capacidade: form.capacidade || null,
        descricao: form.descricao || null,
        fotoUrl: form.fotoUrl || null,
        valorLocacao: form.valorLocacao ? Number(form.valorLocacao) : null,
        tipoLocacao: form.tipoLocacao,
      }
      if (isEdit) await api.put(`/modelos/${modelo.id}`, payload)
      else await api.post('/modelos', payload)
      onSuccess()
    } catch (err: any) {
      setErro(err.response?.data?.message || `Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} modelo.`)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-900">{isEdit ? 'Editar modelo' : 'Novo modelo'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo *</label>
            <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className={inputCls} style={inputStyle}>
              {tipos.map((t) => (<option key={t.v} value={t.v}>{t.l}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nome do modelo *</label>
            <input value={form.nome} onChange={(e) => set('nome', e.target.value)} required placeholder="Ex: 20ft Dry Standard" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Capacidade padrão</label>
            <input value={form.capacidade} onChange={(e) => set('capacidade', e.target.value)} placeholder="Ex: 28t / 33m³" className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valor locação (R$)</label>
              <input value={form.valorLocacao} onChange={(e) => set('valorLocacao', e.target.value)} type="number" step="0.01" min="0" placeholder="0,00" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select value={form.tipoLocacao} onChange={(e) => set('tipoLocacao', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="HORA">Hora</option>
                <option value="DIARIA">Diária</option>
                <option value="SEMANAL">Semanal</option>
                <option value="MENSAL">Mensal</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Descrição padrão</label>
            <textarea value={form.descricao} onChange={(e) => set('descricao', e.target.value)} rows={3} placeholder="Aparece pré-preenchida ao criar equipamentos deste modelo" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Foto padrão</label>
            {form.fotoUrl ? (
              <div className="relative inline-block">
                <img src={form.fotoUrl} alt="Foto do modelo" className="rounded-xl max-h-40 object-contain" style={{ border: '1px solid #E0DDD8' }} />
                <button
                  type="button"
                  onClick={() => set('fotoUrl', '')}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center text-red-600 hover:bg-red-50"
                  style={{ border: '1px solid #FACACA' }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer rounded-xl py-3 px-4 text-gray-500 hover:bg-gray-50 transition-all text-sm" style={{ border: '2px dashed #E0DDD8' }}>
                {processandoFoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#FFAF06' }} />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-4 h-4" style={{ color: '#FFAF06' }} />
                    <span>Enviar foto (comprimida automaticamente)</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" disabled={processandoFoto} onChange={(e) => handleFoto(e.target.files?.[0])} />
              </label>
            )}
          </div>
          {erro && (<div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erro}</div>)}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Salvar alterações' : 'Cadastrar modelo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
