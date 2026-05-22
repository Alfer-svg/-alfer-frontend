import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2, AlertCircle, Plus, Trash2, FileCheck, X } from 'lucide-react'

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
    frete: '',
    periodicidade: 'Mensal',
    condicaoPagamento: 'D_30',
    formaPagamento: 'BOLETO',
    dtInicio: '',
    dtFim: '',
    validade: '7',
    observacoes: '',
  })
  const [condicoes, setCondicoes] = useState<string[]>([''])
  const [showPickerCond, setShowPickerCond] = useState(false)
  const [condicoesPadrao, setCondicoesPadrao] = useState<any[]>([])

  useEffect(() => {
    const params: any = { ativo: 'true' }
    // Se um equipamento foi selecionado, filtra condições aplicáveis ao tipo dele
    if (form.equipamentoId) {
      const equip = equipamentos.find((e) => e.id === form.equipamentoId)
      if (equip?.tipo) params.tipo = equip.tipo
    }
    api.get('/condicoes-orcamento', { params })
      .then((r) => setCondicoesPadrao(r.data))
      .catch(() => setCondicoesPadrao([]))
  }, [form.equipamentoId, equipamentos])

  const aplicarCondicoes = (selecionadas: string[]) => {
    setCondicoes((cs) => {
      const semVazias = cs.filter((c) => c.trim())
      const novas = [...semVazias, ...selecionadas.filter((s) => !semVazias.includes(s))]
      return novas.length > 0 ? novas : ['']
    })
    setShowPickerCond(false)
  }

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
          frete: o.frete != null ? String(o.frete) : '',
          periodicidade: o.periodicidade || 'Mensal',
          condicaoPagamento: o.condicaoPagamento || 'D_30',
          formaPagamento: o.formaPagamento || 'BOLETO',
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
  const frete = Number(form.frete || 0)
  const comDesconto = Math.max(0, valor - (valor * desconto) / 100)
  const valorFinal = comDesconto + frete

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
        frete: frete || null,
        periodicidade: form.periodicidade,
        condicaoPagamento: form.condicaoPagamento,
        formaPagamento: form.formaPagamento,
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input value={form.valor} onChange={(e) => set('valor', e.target.value)} type="number" step="0.01" min="0" required placeholder="0,00" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (%)</label>
              <input value={form.desconto} onChange={(e) => set('desconto', e.target.value)} type="number" step="0.01" min="0" max="100" placeholder="0" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frete (R$)</label>
              <input value={form.frete} onChange={(e) => set('frete', e.target.value)} type="number" step="0.01" min="0" placeholder="0,00" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
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
              <div>Valor final: <strong>R$ {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
              {(desconto > 0 || frete > 0) && (
                <div className="text-xs text-gray-600 mt-1">
                  Locação: R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {desconto > 0 && ` − ${desconto}% desconto = R$ ${comDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  {frete > 0 && ` + R$ ${frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} frete`}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Pagamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condição de pagamento</label>
              <select value={form.condicaoPagamento} onChange={(e) => set('condicaoPagamento', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="A_VISTA">À vista</option>
                <option value="D_15">15 dias</option>
                <option value="D_30">30 dias</option>
                <option value="D_45">45 dias</option>
                <option value="D_60">60 dias</option>
                <option value="PARCELADO_30_60">Parcelado 30/60</option>
                <option value="PARCELADO_30_60_90">Parcelado 30/60/90</option>
                <option value="PERSONALIZADO">Personalizado (detalhar em condições)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pagamento</label>
              <select value={form.formaPagamento} onChange={(e) => set('formaPagamento', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="BOLETO">Boleto bancário</option>
                <option value="PIX">PIX</option>
                <option value="NF_TED">NF + TED</option>
                <option value="TRANSFERENCIA">Transferência</option>
              </select>
            </div>
          </div>
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
            <div className="flex gap-2">
              {condicoesPadrao.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPickerCond(true)}
                  className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg"
                  style={{ color: '#1A5276', background: '#E3EEFA' }}
                  title="Selecionar das condições padrão cadastradas"
                >
                  <FileCheck className="w-3.5 h-3.5" /> Das padrão
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/condicoes-orcamento')}
                className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50"
                title="Gerenciar condições padrão"
              >
                Gerenciar →
              </button>
              <button type="button" onClick={addCondicao} className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg" style={{ color: '#FFAF06', background: '#FFF8E6' }}>
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
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

      {showPickerCond && (
        <PickerCondicoes
          condicoes={condicoesPadrao}
          jaSelecionadas={condicoes.filter((c) => c.trim())}
          onClose={() => setShowPickerCond(false)}
          onConfirm={aplicarCondicoes}
        />
      )}
    </div>
  )
}

function PickerCondicoes({ condicoes, jaSelecionadas, onClose, onConfirm }: {
  condicoes: any[]
  jaSelecionadas: string[]
  onClose: () => void
  onConfirm: (selecionadas: string[]) => void
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(jaSelecionadas))

  const toggle = (texto: string) => {
    setSel((s) => {
      const n = new Set(s)
      if (n.has(texto)) n.delete(texto)
      else n.add(texto)
      return n
    })
  }

  // Agrupa por categoria
  const grupos = condicoes.reduce((acc: Record<string, any[]>, c: any) => {
    const cat = c.categoria || 'Geral'
    acc[cat] = acc[cat] || []
    acc[cat].push(c)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-900">Selecionar condições padrão</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{sel.size} selecionada(s). Marque as que quiser incluir no orçamento.</p>

        <div className="flex-1 overflow-y-auto space-y-4 -mx-2 px-2">
          {Object.entries(grupos).map(([cat, items]) => (
            <div key={cat}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat}</div>
              <div className="space-y-2">
                {(items as any[]).map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.texto)}
                    className="w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all"
                    style={{
                      background: sel.has(c.texto) ? '#FFF8E6' : '#F9F7F4',
                      border: sel.has(c.texto) ? '2px solid #FFAF06' : '2px solid transparent',
                    }}
                  >
                    <input type="checkbox" checked={sel.has(c.texto)} readOnly className="mt-0.5 w-4 h-4" style={{ accentColor: '#FFAF06' }} />
                    <span className="text-sm text-gray-700 flex-1">{c.texto}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4 mt-4 border-t" style={{ borderColor: '#F1EFE8' }}>
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="button" onClick={() => onConfirm(Array.from(sel))} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900" style={{ background: '#FFAF06' }}>
            Aplicar ({sel.size})
          </button>
        </div>
      </div>
    </div>
  )
}
