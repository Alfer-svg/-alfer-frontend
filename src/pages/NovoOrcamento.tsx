import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { Modal } from '../components/Modal'
import { ArrowLeft, Loader2, AlertCircle, Plus, Trash2, FileCheck, X, MapPin, Search, UserPlus } from 'lucide-react'
import { buscarCep, formatarCep, limparCep } from '../utils/cep'
import { buscarCnpj, limparCnpj, formatarCnpj } from '../utils/cnpj'

export default function NovoOrcamento() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const [carregando, setCarregando] = useState(isEdit)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [clientes, setClientes] = useState<any[]>([])
  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [novoClienteModal, setNovoClienteModal] = useState(false)
  const [form, setForm] = useState({
    clienteId: '',
    equipamentoId: '',
    descricao: '',
    valor: '',
    desconto: '',
    frete: '',
    valorMobilizacao: '',
    valorDesmobilizacao: '',
    periodicidade: 'Mensal',
    // Default PERSONALIZADO: faturas mensais recorrentes usam periodicidade+diaVencFatura.
    // As outras opções (D_30, A_VISTA, PARCELADO) só geram UMA fatura — ignoram diaVencFatura.
    condicaoPagamento: 'PERSONALIZADO',
    formaPagamento: 'BOLETO',
    diaVencFatura: '5',
    localMobilizacao: '',
    dtInicio: '',
    dtFim: '',
    validade: '7',
    observacoes: '',
  })
  const [condicoes, setCondicoes] = useState<string[]>([''])
  const [showPickerCond, setShowPickerCond] = useState(false)
  const [condicoesPadrao, setCondicoesPadrao] = useState<any[]>([])
  // Endereço estruturado pro local de mobilização — quando preenchido,
  // monta a string e popula form.localMobilizacao
  const [endMob, setEndMob] = useState({
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  })
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erroCep, setErroCep] = useState('')

  const setMob = (k: string, v: string) => setEndMob((s) => ({ ...s, [k]: v }))

  // Monta a string sempre que algum campo estruturado mudar
  useEffect(() => {
    const partes: string[] = []
    if (endMob.logradouro) {
      let l = endMob.logradouro
      if (endMob.numero) l += `, ${endMob.numero}`
      if (endMob.complemento) l += ` - ${endMob.complemento}`
      partes.push(l)
    }
    if (endMob.bairro) partes.push(endMob.bairro)
    if (endMob.cidade) partes.push(endMob.cidade + (endMob.estado ? `/${endMob.estado}` : ''))
    if (endMob.cep) partes.push(`CEP ${endMob.cep}`)
    const str = partes.join(', ')
    if (str) setForm((f) => ({ ...f, localMobilizacao: str }))
  }, [endMob])

  const buscarEnderecoPorCep = async (v: string) => {
    setErroCep('')
    const cepFmt = formatarCep(v)
    setMob('cep', cepFmt)
    if (limparCep(v).length === 8) {
      setBuscandoCep(true)
      try {
        const d = await buscarCep(v)
        setEndMob((s) => ({
          ...s,
          cep: d.cep,
          logradouro: d.logradouro,
          bairro: d.bairro,
          cidade: d.cidade,
          estado: d.estado,
          // mantém número/complemento se já preenchidos
        }))
      } catch (e: any) {
        setErroCep(e.message || 'CEP não encontrado')
      } finally {
        setBuscandoCep(false)
      }
    }
  }

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
          valorMobilizacao: o.valorMobilizacao != null ? String(o.valorMobilizacao) : '',
          valorDesmobilizacao: o.valorDesmobilizacao != null ? String(o.valorDesmobilizacao) : '',
          periodicidade: o.periodicidade || 'Mensal',
          condicaoPagamento: o.condicaoPagamento || 'PERSONALIZADO',
          formaPagamento: o.formaPagamento || 'BOLETO',
          diaVencFatura: String(o.diaVencFatura ?? 5),
          localMobilizacao: o.localMobilizacao || '',
          // Pega só YYYY-MM-DD direto da string pra evitar shift de fuso (UTC -> BR vira -1 dia)
          dtInicio: o.dtInicio ? String(o.dtInicio).slice(0, 10) : '',
          dtFim: o.dtFim ? String(o.dtFim).slice(0, 10) : '',
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
  const valorMobilizacao = Number(form.valorMobilizacao || 0)
  const valorDesmobilizacao = Number(form.valorDesmobilizacao || 0)
  const comDesconto = Math.max(0, valor - (valor * desconto) / 100)
  const valorFinal = comDesconto + frete + valorMobilizacao + valorDesmobilizacao

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
        valorMobilizacao: valorMobilizacao || null,
        valorDesmobilizacao: valorDesmobilizacao || null,
        periodicidade: form.periodicidade,
        condicaoPagamento: form.condicaoPagamento,
        formaPagamento: form.formaPagamento,
        diaVencFatura: Math.max(1, Math.min(31, Number(form.diaVencFatura) || 5)),
        localMobilizacao: form.localMobilizacao || null,
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
              <div className="flex gap-2">
                <select value={form.clienteId} onChange={(e) => set('clienteId', e.target.value)} required className={inputCls + ' flex-1'} style={inputStyle}>
                  <option value="">Selecione</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.razaoSocial}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setNovoClienteModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-900 hover:opacity-90 whitespace-nowrap"
                  style={{ background: '#FFAF06' }}
                  title="Cadastrar cliente novo sem sair daqui"
                >
                  <UserPlus className="w-4 h-4" />
                  Novo
                </button>
              </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1" title="Taxa única — cobrar pra entregar/instalar o equipamento">Mobilização (R$)</label>
              <input value={form.valorMobilizacao} onChange={(e) => set('valorMobilizacao', e.target.value)} type="number" step="0.01" min="0" placeholder="0,00" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" title="Taxa única — cobrar pra retirar o equipamento ao fim da locação">Desmobilização (R$)</label>
              <input value={form.valorDesmobilizacao} onChange={(e) => set('valorDesmobilizacao', e.target.value)} type="number" step="0.01" min="0" placeholder="0,00" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
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
              {(desconto > 0 || frete > 0 || valorMobilizacao > 0 || valorDesmobilizacao > 0) && (
                <div className="text-xs text-gray-600 mt-1">
                  Locação: R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {desconto > 0 && ` − ${desconto}% desconto = R$ ${comDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  {frete > 0 && ` + R$ ${frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} frete`}
                  {valorMobilizacao > 0 && ` + R$ ${valorMobilizacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} mob.`}
                  {valorDesmobilizacao > 0 && ` + R$ ${valorDesmobilizacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} desmob.`}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia de vencimento da fatura</label>
              <div className="flex items-center gap-2">
                <input
                  value={form.diaVencFatura}
                  onChange={(e) => set('diaVencFatura', e.target.value.replace(/\D/g, '').slice(0, 2))}
                  type="number" min="1" max="31"
                  className={`${inputCls} max-w-[120px]`}
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  placeholder="5"
                />
                <span className="text-xs text-gray-500">de cada mês (1–31)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: '#FFAF06' }} /> Local de mobilização
          </h2>
          <p className="text-xs text-gray-500 mb-4">Onde os equipamentos serão entregues. Digite o CEP que o resto preenche automaticamente.</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div className="md:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">CEP</label>
              <div className="relative">
                <input
                  value={endMob.cep}
                  onChange={(e) => buscarEnderecoPorCep(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className={inputCls + ' pr-8'}
                  style={inputStyle}
                />
                {buscandoCep ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {erroCep && <div className="text-xs text-red-600 mt-1">{erroCep}</div>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Logradouro</label>
              <input value={endMob.logradouro} onChange={(e) => setMob('logradouro', e.target.value)} placeholder="Rua / Av." className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número</label>
              <input value={endMob.numero} onChange={(e) => setMob('numero', e.target.value)} placeholder="123" className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Complemento</label>
              <input value={endMob.complemento} onChange={(e) => setMob('complemento', e.target.value)} placeholder="Obra X / Bloco B" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bairro</label>
              <input value={endMob.bairro} onChange={(e) => setMob('bairro', e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cidade</label>
              <input value={endMob.cidade} onChange={(e) => setMob('cidade', e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">UF</label>
              <input value={endMob.estado} onChange={(e) => setMob('estado', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Endereço completo (preenchido automaticamente — pode ajustar à mão se precisar)</label>
            <textarea
              value={form.localMobilizacao}
              onChange={(e) => set('localMobilizacao', e.target.value)}
              rows={2}
              placeholder="Ou cole o endereço completo aqui se preferir não usar os campos acima."
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
              style={inputStyle}
            />
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

      {novoClienteModal && (
        <NovoClienteRapido
          onClose={() => setNovoClienteModal(false)}
          onCriado={(novo) => {
            // Coloca o novo cliente no topo da lista e já seleciona ele
            setClientes((cs) => [novo, ...cs])
            set('clienteId', novo.id)
            setNovoClienteModal(false)
          }}
        />
      )}
    </div>
  )
}

/**
 * Modal compacto pra cadastrar cliente sem sair do orçamento.
 * Pede só o essencial — endereço/contatos podem ser preenchidos depois
 * editando o cliente. CNPJ tem auto-busca na Receita Federal.
 */
function NovoClienteRapido({ onClose, onCriado }: { onClose: () => void; onCriado: (c: any) => void }) {
  const [form, setForm] = useState({
    razaoSocial: '',
    cnpj: '',
    inscricaoEstadual: '',
    segmento: 'CONSTRUTORA',
    prazoPagemento: '30',
  })
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [erroCnpj, setErroCnpj] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const setF = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleCnpjBlur = async () => {
    setErroCnpj('')
    const limpo = limparCnpj(form.cnpj)
    if (!limpo) return
    if (limpo.length !== 14) {
      setErroCnpj('CNPJ precisa ter 14 dígitos.')
      return
    }
    setBuscandoCnpj(true)
    try {
      const d = await buscarCnpj(form.cnpj)
      setForm((f) => ({
        ...f,
        cnpj: d.cnpj,
        razaoSocial: f.razaoSocial || d.razaoSocial,
      }))
    } catch (e: any) {
      setErroCnpj(e?.message || 'Não foi possível buscar o CNPJ.')
    } finally {
      setBuscandoCnpj(false)
    }
  }

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.razaoSocial.trim()) {
      setErro('Razão social é obrigatória.')
      return
    }
    if (!form.cnpj.trim() || limparCnpj(form.cnpj).length !== 14) {
      setErro('CNPJ inválido — precisa ter 14 dígitos.')
      return
    }
    setSalvando(true)
    try {
      const r = await api.post('/clientes', {
        razaoSocial: form.razaoSocial.trim(),
        cnpj: form.cnpj.trim(),
        inscricaoEstadual: form.inscricaoEstadual.trim() || undefined,
        segmento: form.segmento,
        status: 'ATIVO',
        prazoPagemento: Number(form.prazoPagemento),
      })
      onCriado(r.data)
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Erro ao criar cliente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <UserPlus className="w-5 h-5" style={{ color: '#FFAF06' }} />
          Novo cliente
        </h2>
        <button type="button" onClick={onClose}>
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Cadastro rápido — só o essencial. Você pode completar endereço, contatos e
        outros dados depois editando o cliente.
      </p>

      <form onSubmit={salvar} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ <span style={{ color: '#FFAF06' }}>*</span></label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.cnpj}
              onChange={(e) => setF('cnpj', formatarCnpj(e.target.value))}
              onBlur={handleCnpjBlur}
              placeholder="00.000.000/0000-00"
              required
              className="flex-1 px-3 py-2 bg-white rounded-lg text-sm outline-none focus:ring-2"
              style={{ border: '1px solid #E0DDD8', ['--tw-ring-color' as any]: '#FFD580' }}
            />
            <button
              type="button"
              onClick={handleCnpjBlur}
              disabled={buscandoCnpj}
              className="px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
              style={{ border: '1px solid #E0DDD8' }}
              title="Buscar dados na Receita Federal"
            >
              {buscandoCnpj ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Search className="w-3.5 h-3.5 inline mr-1" />Buscar</>}
            </button>
          </div>
          {erroCnpj && <p className="text-[11px] text-red-600 mt-1">{erroCnpj}</p>}
          {!erroCnpj && <p className="text-[11px] text-gray-400 mt-1">Ao sair do campo, busca dados automaticamente na Receita.</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Razão social <span style={{ color: '#FFAF06' }}>*</span></label>
          <input
            type="text"
            value={form.razaoSocial}
            onChange={(e) => setF('razaoSocial', e.target.value)}
            required
            className="w-full px-3 py-2 bg-white rounded-lg text-sm outline-none focus:ring-2"
            style={{ border: '1px solid #E0DDD8', ['--tw-ring-color' as any]: '#FFD580' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Inscrição estadual</label>
            <input
              type="text"
              value={form.inscricaoEstadual}
              onChange={(e) => setF('inscricaoEstadual', e.target.value)}
              placeholder="ISENTO"
              className="w-full px-3 py-2 bg-white rounded-lg text-sm outline-none focus:ring-2"
              style={{ border: '1px solid #E0DDD8', ['--tw-ring-color' as any]: '#FFD580' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prazo pagamento (dias)</label>
            <input
              type="number"
              value={form.prazoPagemento}
              onChange={(e) => setF('prazoPagemento', e.target.value)}
              min={0}
              className="w-full px-3 py-2 bg-white rounded-lg text-sm outline-none focus:ring-2"
              style={{ border: '1px solid #E0DDD8', ['--tw-ring-color' as any]: '#FFD580' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Segmento <span style={{ color: '#FFAF06' }}>*</span></label>
          <select
            value={form.segmento}
            onChange={(e) => setF('segmento', e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-lg text-sm outline-none focus:ring-2"
            style={{ border: '1px solid #E0DDD8', ['--tw-ring-color' as any]: '#FFD580' }}
          >
            <option value="CONSTRUTORA">Construtora</option>
            <option value="INDUSTRIA_REFINARIA">Indústria / Refinaria</option>
            <option value="PORTO_LOGISTICA">Porto / Logística</option>
            <option value="PREFEITURA_GOVERNO">Prefeitura / Governo</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>

        {erro && (
          <div className="p-3 rounded-xl text-red-700 text-sm flex items-center gap-2"
               style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                  style={{ border: '1px solid #E0DDD8' }}>
            Cancelar
          </button>
          <button type="submit" disabled={salvando}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2"
                  style={{ background: salvando ? '#CC8C00' : '#FFAF06' }}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar e usar'}
          </button>
        </div>
      </form>
    </Modal>
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
    <Modal onClose={onClose} maxWidth="max-w-2xl">
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
    </Modal>
  )
}
