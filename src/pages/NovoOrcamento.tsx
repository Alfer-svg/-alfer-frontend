import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react'

export default function NovoOrcamento() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const [carregando, setCarregando] = useState(isEdit)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [clientes, setClientes] = useState<any[]>([])
  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [form, setForm] = useState({
    clienteId: '',
    equipamentoId: '',
    descricao: '',
    valor: '',
    desconto: '',
    periodicidade: 'Mensal',
    dtInicio: '',
    dtFim: '',
    validade: '7',
    observacoes: '',
  })
  const [condicoes, setCondicoes] = useState<string[]>([''])

  useEffect(() => {
    Promise.all([api.get('/clientes'), api.get('/equipamentos')])
      .then(([c, e]) => {
        setClientes(c.data)
        setEquipamentos(e.data)
      })
  }, [])

  useEffect(() => {
    if (!isEdit) return
    api.get(`/orcamentos/${id}`)
      .then((r) => {
        const o = r.data
        setForm({
          clienteId: o.clienteId || '',
          equipamentoId: o.equipamentoId || '',
          descricao: o.descricao || '',
          valor: o.valor != null ? String(o.valor) : '',
          desconto: o.desconto != null ? String(o.desconto) : '',
          periodicidade: o.periodicidade || 'Mensal',
          dtInicio: o.dtInicio ? new Date(o.dtInicio).toISOString().slice(0, 10) : '',
          dtFim: o.dtFim ? new Date(o.dtFim).toISOString().slice(0, 10) : '',
          validade: String(o.validade ?? 7),
          observacoes: o.observacoes || '',
        })
        setCondicoes(Array.isArray(o.condicoes) && o.condicoes.length ? o.condicoes : [''])
      })
      .finally(() => setCarregando(false))
  }, [id, isEdit])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const valor = Number(form.valor || 0)
  const desconto = Number(form.desconto || 0)
  const valorFinal = Math.max(0, valor - (valor * desconto) / 100)

  const setCondicao = (i: number, v: string) => setCondicoes((cs) => cs.map((c, idx) => (idx === i ? v : c)))
  const addCondicao = () => setCondicoes((cs) => [...cs, ''])
  const removeCondicao = (i: number) => setCondicoes((cs) => cs.filter((_, idx) => idx !== i))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.clienteId) return setErro('Selecione um cliente.')
    if (!form.valor || valor <= 0) return setErro('Informe um valor válido.')
    setLoading(true)
    try {
      const payload = {
        clienteId: form.clienteId,
        equipamentoId: form.equipamentoId || null,
        descricao: form.descricao || null,
        valor,
        desconto: desconto || null,
        periodicidade: form.periodicidade,
        dtInicio: form.dtInicio || null,
        dtFim: form.dtFim || null,
        validade: Number(form.validade) || 7,
        condicoes: condicoes.map((c) => c.trim()).filter(Boolean),
        observacoes: form.observacoes || null,
      }
      if (isEdit) await api.put(`/orcamentos/${id}`, payload)
      else await api.post('/orcamentos', payload)
      navigate('/orcamentos')
    } catch (err: any) {
      setErro(err.response?.data?.message || `Erro ao ${isEdit ? 'atualizar' : 'criar'} orçamento.`)
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
      <button onClick={() => navigate('/orcamentos')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all">
        <ArrowLeft className="w-4 h-4" /> Voltar para orçamentos
      </button>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">{isEdit ? 'Editar orçamento' : 'Novo orçamento'}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isEdit ? 'Atualize os dados do orçamento' : 'Crie um orçamento pra enviar ao cliente. Se aprovado, vira pedido + contrato.'}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Cliente e equipamento</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select value={form.clienteId} onChange={(e) => set('clienteId', e.target.value)} required className={inputCls} style={inputStyle}>
                <option value="">Selecione</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.razaoSocial}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento (opcional)</label>
              <select value={form.equipamentoId} onChange={(e) => set('equipamentoId', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">— Sem equipamento específico —</option>
                {equipamentos.map((e) => <option key={e.id} value={e.id}>{e.codigo} — {e.modelo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do que está sendo orçado</label>
              <textarea value={form.descricao} onChange={(e) => set('descricao', e.target.value)} rows={3} placeholder="Ex: Locação de container 20 pés por 12 meses..." className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Valor</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input value={form.valor} onChange={(e) => set('valor', e.target.value)} type="number" step="0.01" min="0" required placeholder="0,00" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (%)</label>
              <input value={form.desconto} onChange={(e) => set('desconto', e.target.value)} type="number" step="0.01" min="0" max="100" placeholder="0" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodicidade</label>
              <select value={form.periodicidade} onChange={(e) => set('periodicidade', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="Único">Pagamento único</option>
                <option value="Mensal">Mensal</option>
                <option value="Quinzenal">Quinzenal</option>
                <option value="Semanal">Semanal</option>
                <option value="Diária">Diária</option>
              </select>
            </div>
          </div>
          {valor > 0 && (
            <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: '#FFF8E6', border: '1px solid #FFD577' }}>
              Valor final: <strong>R$ {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              {desconto > 0 && <span className="text-gray-600 ml-2">(R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - {desconto}%)</span>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Vigência e validade</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de início</label>
              <input value={form.dtInicio} onChange={(e) => set('dtInicio', e.target.value)} type="date" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de fim</label>
              <input value={form.dtFim} onChange={(e) => set('dtFim', e.target.value)} type="date" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validade da proposta (dias)</label>
              <input value={form.validade} onChange={(e) => set('validade', e.target.value)} type="number" min="1" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Condições</h2>
            <button type="button" onClick={addCondicao} className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg" style={{ color: '#FFAF06', background: '#FFF8E6' }}>
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {condicoes.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={c} onChange={(e) => setCondicao(i, e.target.value)} placeholder="Ex: Pagamento em até 30 dias, frete por conta do cliente..." className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none bg-white" style={inputStyle} />
                {condicoes.length > 1 && (
                  <button type="button" onClick={() => removeCondicao(i)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Observações</h2>
          <textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
        </div>

        {erro && (<div className="p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}><AlertCircle className="w-4 h-4" /> {erro}</div>)}

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate('/orcamentos')} className="px-6 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>) : (isEdit ? 'Salvar alterações' : 'Criar orçamento')}
          </button>
        </div>
      </form>
    </div>
  )
}
