import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2, AlertCircle, ImagePlus, X, Plus, Trash2 } from 'lucide-react'
import { comprimirImagem } from '../utils/imagem'

const tipos = [
  { v: 'CONTAINER_SECO', l: 'Container Seco' },
  { v: 'CONTAINER_REEFER', l: 'Container Reefer' },
  { v: 'CACAMBA_ESTACIONARIA', l: 'Caçamba Estacionária' },
  { v: 'CAMINHAO_MUNCK', l: 'Caminhão Munck' },
  { v: 'CAMINHAO_POLIGUINDASTE', l: 'Caminhão Poliguindaste' },
  { v: 'CAMINHAO_CAVALO_MECANICO', l: 'Caminhão Cavalo Mecânico' },
]

export default function NovoModelo() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const [carregando, setCarregando] = useState(isEdit)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [erroFoto, setErroFoto] = useState('')
  const [processandoFoto, setProcessandoFoto] = useState(false)
  const [form, setForm] = useState({
    tipo: 'CONTAINER_SECO',
    nome: '',
    capacidade: '',
    descricao: '',
    fotoUrl: '',
  })
  const [precos, setPrecos] = useState<{ tipoLocacao: string; valor: string }[]>([])

  useEffect(() => {
    if (!isEdit) return
    api.get(`/modelos/${id}`)
      .then((r) => {
        const m = r.data
        setForm({
          tipo: m.tipo || 'CONTAINER_SECO',
          nome: m.nome || '',
          capacidade: m.capacidade || '',
          descricao: m.descricao || '',
          fotoUrl: m.fotoUrl || '',
        })
        if (Array.isArray(m.precos) && m.precos.length) {
          setPrecos(m.precos.map((p: any) => ({ tipoLocacao: p.tipoLocacao, valor: String(p.valor) })))
        } else if (m.valorLocacao != null) {
          setPrecos([{ tipoLocacao: m.tipoLocacao || 'MENSAL', valor: String(m.valorLocacao) }])
        }
      })
      .finally(() => setCarregando(false))
  }, [id, isEdit])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleFoto = async (file: File | undefined) => {
    setErroFoto('')
    if (!file) return
    setProcessandoFoto(true)
    try {
      const dataUrl = await comprimirImagem(file)
      set('fotoUrl', dataUrl)
    } catch (err: any) {
      setErroFoto(err?.message || 'Erro ao processar a imagem.')
    } finally {
      setProcessandoFoto(false)
    }
  }

  const addPreco = () => {
    const usados = new Set(precos.map((p) => p.tipoLocacao))
    const disponivel = ['HORA', 'DIARIA', 'SEMANAL', 'MENSAL'].find((t) => !usados.has(t)) || 'MENSAL'
    setPrecos((ps) => [...ps, { tipoLocacao: disponivel, valor: '' }])
  }
  const setPreco = (i: number, k: 'tipoLocacao' | 'valor', v: string) =>
    setPrecos((ps) => ps.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)))
  const removePreco = (i: number) => setPrecos((ps) => ps.filter((_, idx) => idx !== i))

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
        precos: precos.filter((p) => p.valor !== '').map((p) => ({ tipoLocacao: p.tipoLocacao, valor: Number(p.valor) })),
      }
      if (isEdit) await api.put(`/modelos/${id}`, payload)
      else await api.post('/modelos', payload)
      navigate('/modelos')
    } catch (err: any) {
      setErro(err.response?.data?.message || `Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} modelo.`)
    } finally {
      setLoading(false)
    }
  }

  if (carregando) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }
  const onFocus = (e: any) => (e.target.style.borderColor = '#FFAF06')
  const onBlur = (e: any) => (e.target.style.borderColor = '#E0DDD8')

  return (
    <div className="p-8 max-w-3xl animate-fade-in">
      <button onClick={() => navigate('/modelos')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all">
        <ArrowLeft className="w-4 h-4" /> Voltar para modelos
      </button>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">{isEdit ? 'Editar modelo' : 'Novo modelo de equipamento'}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isEdit ? 'Atualize os dados do modelo' : 'Cadastre um modelo padrão que pode ser reutilizado ao criar equipamentos'}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Identificação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className={inputCls} style={inputStyle}>
                {tipos.map((t) => (<option key={t.v} value={t.v}>{t.l}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do modelo *</label>
              <input value={form.nome} onChange={(e) => set('nome', e.target.value)} required placeholder="Ex: 20ft Dry Standard" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade padrão</label>
              <input value={form.capacidade} onChange={(e) => set('capacidade', e.target.value)} placeholder="Ex: 28t / 33m³" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Tabela de preços padrão</h2>
            <button
              type="button"
              onClick={addPreco}
              disabled={precos.length >= 4}
              className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ color: '#FFAF06', background: '#FFF8E6' }}
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>
          {precos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Sem preços. Os equipamentos deste modelo herdam estes valores quando você selecionar o modelo no cadastro.
            </p>
          ) : (
            <div className="space-y-2">
              {precos.map((p, i) => (
                <div key={i} className="flex gap-2 items-center p-3 rounded-xl" style={{ background: '#F9F7F4', border: '1px solid #E0DDD8' }}>
                  <select
                    value={p.tipoLocacao}
                    onChange={(e) => setPreco(i, 'tipoLocacao', e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm outline-none bg-white"
                    style={{ border: '1px solid #E0DDD8', minWidth: '110px' }}
                  >
                    <option value="HORA">Hora</option>
                    <option value="DIARIA">Diária</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="MENSAL">Mensal</option>
                  </select>
                  <span className="text-sm text-gray-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={p.valor}
                    onChange={(e) => setPreco(i, 'valor', e.target.value)}
                    placeholder="0,00"
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none bg-white"
                    style={{ border: '1px solid #E0DDD8' }}
                  />
                  <button type="button" onClick={() => removePreco(i)} className="text-red-400 hover:text-red-600 p-1" title="Remover">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Descrição padrão</h2>
          <textarea
            value={form.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            rows={4}
            placeholder="Aparece pré-preenchida ao criar equipamentos deste modelo"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
            style={inputStyle}
          />
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Foto padrão</h2>
          {form.fotoUrl ? (
            <div className="relative inline-block">
              <img src={form.fotoUrl} alt="Foto do modelo" className="rounded-xl max-h-64 object-contain" style={{ border: '1px solid #E0DDD8' }} />
              <button
                type="button"
                onClick={() => set('fotoUrl', '')}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center text-red-600 hover:bg-red-50"
                style={{ border: '1px solid #FACACA' }}
                title="Remover foto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-xl py-8 px-4 text-gray-500 hover:bg-gray-50 transition-all" style={{ border: '2px dashed #E0DDD8' }}>
              {processandoFoto ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#FFAF06' }} />
                  <span className="text-sm font-medium">Processando imagem...</span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-7 h-7" style={{ color: '#FFAF06' }} />
                  <span className="text-sm font-medium">Enviar foto</span>
                  <span className="text-xs text-gray-400">comprimida automaticamente</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" disabled={processandoFoto} onChange={(e) => handleFoto(e.target.files?.[0])} />
            </label>
          )}
          {erroFoto && (
            <div className="mt-3 p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erroFoto}
            </div>
          )}
        </div>

        {erro && (
          <div className="p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate('/modelos')} className="px-6 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>) : (isEdit ? 'Salvar alterações' : 'Cadastrar modelo')}
          </button>
        </div>
      </form>
    </div>
  )
}
