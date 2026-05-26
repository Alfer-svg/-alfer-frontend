import { useState, useEffect, useRef, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2, Plus, Trash2, Search, AlertCircle, CheckCircle2 } from 'lucide-react'
import { buscarCnpj, limparCnpj, formatarCnpj } from '../utils/cnpj'
import { buscarCep, limparCep, formatarCep } from '../utils/cep'

interface Contato {
  id?: string; nome: string; cargo: string; telefone: string; email: string; principal: boolean; recebeFatura?: boolean
}
interface Endereco {
  id?: string; logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string; cep: string; principal: boolean
}

export default function NovoCliente() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(isEdit)
  const [erro, setErro] = useState('')
  const [tipoPessoa, setTipoPessoa] = useState<'PJ' | 'PF'>('PJ')
  const [form, setForm] = useState({
    razaoSocial: '', cnpj: '', inscricaoEstadual: '', site: '',
    segmento: 'CONSTRUTORA', limiteCredito: '', prazoPagemento: '30',
    reajusteIndice: 'IPCA', formaCobranca: 'BOLETO', observacoes: '',
  })
  // IDs originais dos contatos/endereços carregados, pra saber o que foi deletado
  const contatosIniciaisRef = useRef<string[]>([])
  const enderecosIniciaisRef = useRef<string[]>([])
  const [contatos, setContatos] = useState<Contato[]>([
    { nome: '', cargo: '', telefone: '', email: '', principal: true, recebeFatura: true }
  ])
  const [enderecos, setEnderecos] = useState<Endereco[]>([
    { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'PE', cep: '', principal: true }
  ])

  useEffect(() => {
    if (!isEdit) return
    api.get(`/clientes/${id}`)
      .then((r) => {
        const c = r.data
        setForm({
          razaoSocial: c.razaoSocial || '',
          cnpj: c.cnpj || '',
          inscricaoEstadual: c.inscricaoEstadual || '',
          site: c.site || '',
          segmento: c.segmento || 'CONSTRUTORA',
          limiteCredito: c.limiteCredito != null ? String(c.limiteCredito) : '',
          prazoPagemento: c.prazoPagemento != null ? String(c.prazoPagemento) : '30',
          reajusteIndice: c.reajusteIndice || 'IPCA',
          formaCobranca: c.formaCobranca || 'BOLETO',
          observacoes: c.observacoes || '',
        })
        if (c.contatos?.length) {
          const cts = c.contatos.map((ct: any) => ({
            id: ct.id, nome: ct.nome || '', cargo: ct.cargo || '', telefone: ct.telefone || '', email: ct.email || '',
            principal: !!ct.principal, recebeFatura: !!ct.recebeFatura,
          }))
          setContatos(cts)
          contatosIniciaisRef.current = cts.map((x: Contato) => x.id!).filter(Boolean)
        }
        if (c.enderecos?.length) {
          const ens = c.enderecos.map((e: any) => ({
            id: e.id, logradouro: e.logradouro || '', numero: e.numero || '', complemento: e.complemento || '',
            bairro: e.bairro || '', cidade: e.cidade || '', estado: e.estado || 'PE', cep: e.cep || '', principal: !!e.principal,
          }))
          setEnderecos(ens)
          enderecosIniciaisRef.current = ens.map((x: Endereco) => x.id!).filter(Boolean)
        }
      })
      .finally(() => setCarregando(false))
  }, [id, isEdit])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [erroCnpj, setErroCnpj] = useState('')
  const [sucessoCnpj, setSucessoCnpj] = useState(false)

  const fazerBuscaCnpj = async (cnpjRaw?: string) => {
    const cnpj = cnpjRaw ?? form.cnpj
    if (limparCnpj(cnpj).length !== 14) {
      setErroCnpj('Digite os 14 dígitos do CNPJ.')
      return
    }
    setErroCnpj('')
    setSucessoCnpj(false)
    setBuscandoCnpj(true)
    try {
      const d = await buscarCnpj(cnpj)
      setForm(f => ({
        ...f,
        cnpj: d.cnpj,
        razaoSocial: f.razaoSocial || d.razaoSocial,
      }))
      // Preenche o primeiro contato com email/telefone da Receita (se ainda vazio)
      setContatos(cs => {
        const novos = [...cs]
        if (novos[0]) {
          if (!novos[0].telefone && d.telefone) novos[0].telefone = d.telefone
          if (!novos[0].email && d.email) novos[0].email = d.email
          if (!novos[0].nome && d.nomeFantasia) novos[0].nome = d.nomeFantasia
        }
        return novos
      })
      // Preenche o primeiro endereço com o da Receita (se ainda vazio)
      setEnderecos(es => {
        const novos = [...es]
        if (novos[0] && !novos[0].logradouro) {
          novos[0] = {
            ...novos[0],
            logradouro: d.endereco.logradouro,
            numero: d.endereco.numero,
            complemento: d.endereco.complemento,
            bairro: d.endereco.bairro,
            cidade: d.endereco.cidade,
            estado: d.endereco.estado || novos[0].estado,
            cep: d.endereco.cep,
          }
        }
        return novos
      })
      setSucessoCnpj(true)
    } catch (err: any) {
      setErroCnpj(err.message || 'Erro ao buscar CNPJ.')
    } finally {
      setBuscandoCnpj(false)
    }
  }

  const handleCnpjChange = (v: string) => {
    setErroCnpj('')
    setSucessoCnpj(false)
    const formatted = tipoPessoa === 'PJ' ? formatarCnpj(v) : v
    set('cnpj', formatted)
  }

  const [cepBuscando, setCepBuscando] = useState<Record<number, boolean>>({})
  const [cepErro, setCepErro] = useState<Record<number, string>>({})

  const handleCepChange = (i: number, v: string) => {
    const formatted = formatarCep(v)
    setEndereco(i, 'cep', formatted)
    setCepErro((m) => ({ ...m, [i]: '' }))
    // Auto-buscar quando completar 8 dígitos
    if (limparCep(formatted).length === 8) {
      void buscarCepEndereco(i, formatted)
    }
  }

  const buscarCepEndereco = async (i: number, cep: string) => {
    if (limparCep(cep).length !== 8) {
      setCepErro((m) => ({ ...m, [i]: 'CEP precisa ter 8 dígitos.' }))
      return
    }
    setCepBuscando((m) => ({ ...m, [i]: true }))
    setCepErro((m) => ({ ...m, [i]: '' }))
    try {
      const d = await buscarCep(cep)
      setEnderecos((es) => es.map((e, idx) => {
        if (idx !== i) return e
        return {
          ...e,
          cep: d.cep,
          logradouro: e.logradouro || d.logradouro,
          complemento: e.complemento || d.complemento,
          bairro: e.bairro || d.bairro,
          cidade: e.cidade || d.cidade,
          estado: e.estado || d.estado || 'PE',
        }
      }))
    } catch (err: any) {
      setCepErro((m) => ({ ...m, [i]: err.message || 'Erro ao buscar CEP.' }))
    } finally {
      setCepBuscando((m) => ({ ...m, [i]: false }))
    }
  }
  const setContato = (i: number, k: string, v: string) => setContatos(cs => cs.map((c, idx) => idx === i ? { ...c, [k]: v } : c))
  const setEndereco = (i: number, k: string, v: string) => setEnderecos(es => es.map((e, idx) => idx === i ? { ...e, [k]: v } : e))
  const addContato = () => setContatos(cs => [...cs, { nome: '', cargo: '', telefone: '', email: '', principal: false, recebeFatura: false }])
  const toggleRecebeFatura = (i: number) => setContatos(cs => {
    const alvo = cs[i]
    const atualmenteMarcados = cs.filter((c) => c.recebeFatura).length
    // Se vai marcar (estava false) e já tem 6, bloqueia
    if (!alvo.recebeFatura && atualmenteMarcados >= 6) {
      alert('Limite de 6 destinatários de fatura/boleto por cliente. Desmarque um antes.')
      return cs
    }
    return cs.map((c, idx) => idx === i ? { ...c, recebeFatura: !c.recebeFatura } : c)
  })
  const removeContato = (i: number) => setContatos(cs => cs.filter((_, idx) => idx !== i))
  const addEndereco = () => setEnderecos(es => [...es, { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'PE', cep: '', principal: false }])
  const removeEndereco = (i: number) => setEnderecos(es => es.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        limiteCredito: form.limiteCredito ? Number(form.limiteCredito) : undefined,
        prazoPagemento: Number(form.prazoPagemento),
      }
      if (isEdit) {
        await api.put(`/clientes/${id}`, payload)
        // Sincroniza contatos: criar novos, atualizar existentes, deletar removidos
        const idsContatosAtuais = contatos.map(c => c.id).filter(Boolean) as string[]
        const removidosContatos = contatosIniciaisRef.current.filter(x => !idsContatosAtuais.includes(x))
        for (const cid of removidosContatos) {
          await api.delete(`/clientes/contatos/${cid}`).catch(() => {})
        }
        for (const c of contatos.filter(c => c.nome)) {
          if (c.id) {
            await api.put(`/clientes/contatos/${c.id}`, c).catch(() => {})
          } else {
            await api.post(`/clientes/${id}/contatos`, c).catch(() => {})
          }
        }
        // Sincroniza endereços
        const idsEnderecosAtuais = enderecos.map(e => e.id).filter(Boolean) as string[]
        const removidosEnderecos = enderecosIniciaisRef.current.filter(x => !idsEnderecosAtuais.includes(x))
        for (const eid of removidosEnderecos) {
          await api.delete(`/clientes/enderecos/${eid}`).catch(() => {})
        }
        for (const e of enderecos.filter(e => e.logradouro)) {
          if (e.id) {
            await api.put(`/clientes/enderecos/${e.id}`, e).catch(() => {})
          } else {
            await api.post(`/clientes/${id}/enderecos`, e).catch(() => {})
          }
        }
      } else {
        const cliente = await api.post('/clientes', payload)
        const newId = cliente.data.id
        for (const c of contatos.filter(c => c.nome)) {
          await api.post(`/clientes/${newId}/contatos`, c).catch(() => {})
        }
        for (const e of enderecos.filter(e => e.logradouro)) {
          await api.post(`/clientes/${newId}/enderecos`, e).catch(() => {})
        }
      }
      navigate('/clientes')
    } catch (err: any) {
      setErro(err.response?.data?.message || `Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} cliente.`)
    } finally {
      setLoading(false)
    }
  }

  if (carregando) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white"
  const inputStyle = { border: '1px solid #E0DDD8' }
  const onFocus = (e: any) => e.target.style.borderColor = '#FFAF06'
  const onBlur = (e: any) => e.target.style.borderColor = '#E0DDD8'

  return (
    <div className="p-8 max-w-3xl animate-fade-in">
      <button onClick={() => navigate('/clientes')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all">
        <ArrowLeft className="w-4 h-4" /> Voltar para clientes
      </button>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">{isEdit ? 'Editar cliente' : 'Novo cliente'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isEdit ? 'Atualize os dados do cliente. Contatos e endereços não são editados aqui.' : 'Preencha os dados do novo cliente'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Tipo de pessoa */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Tipo de pessoa</h2>
          <div className="flex gap-3">
            {[{ v: 'PJ', l: 'Pessoa Jurídica' }, { v: 'PF', l: 'Pessoa Física' }].map(({ v, l }) => (
              <button
                key={v} type="button"
                onClick={() => setTipoPessoa(v as 'PJ' | 'PF')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: tipoPessoa === v ? '#FFAF06' : '#F5F0EB',
                  color: tipoPessoa === v ? '#1A1C1E' : '#888',
                  border: tipoPessoa === v ? '2px solid #FFAF06' : '2px solid transparent'
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Dados principais */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Dados principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{tipoPessoa === 'PJ' ? 'Razão social' : 'Nome completo'} *</label>
              <input value={form.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} required placeholder={tipoPessoa === 'PJ' ? 'Nome da empresa' : 'Nome do cliente'} className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'} *</label>
              <div className="flex gap-2">
                <input
                  value={form.cnpj}
                  onChange={e => handleCnpjChange(e.target.value)}
                  onBlur={() => {
                    onBlur({ target: { style: { borderColor: '#E0DDD8' } } } as any)
                    if (tipoPessoa === 'PJ' && limparCnpj(form.cnpj).length === 14 && !sucessoCnpj && !buscandoCnpj) {
                      fazerBuscaCnpj()
                    }
                  }}
                  required
                  placeholder={tipoPessoa === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                  className={inputCls}
                  style={inputStyle}
                  onFocus={onFocus}
                />
                {tipoPessoa === 'PJ' && (
                  <button
                    type="button"
                    onClick={() => fazerBuscaCnpj()}
                    disabled={buscandoCnpj || limparCnpj(form.cnpj).length !== 14}
                    title="Buscar dados na Receita Federal"
                    className="flex items-center gap-1 px-3 rounded-xl text-sm font-medium text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: '#FFAF06' }}
                  >
                    {buscandoCnpj ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Buscar
                  </button>
                )}
              </div>
              {erroCnpj && (
                <div className="mt-2 text-xs text-red-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" /> {erroCnpj}
                </div>
              )}
              {sucessoCnpj && (
                <div className="mt-2 text-xs text-green-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Dados preenchidos da Receita Federal
                </div>
              )}
              {tipoPessoa === 'PJ' && !erroCnpj && !sucessoCnpj && (
                <p className="text-xs text-gray-400 mt-1">Digite o CNPJ e clique em buscar pra preencher razão social, endereço e contato automaticamente.</p>
              )}
            </div>
            {tipoPessoa === 'PJ' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição estadual</label>
                <input value={form.inscricaoEstadual} onChange={e => set('inscricaoEstadual', e.target.value)} placeholder="Opcional" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            )}
            {tipoPessoa === 'PJ' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <input value={form.site} onChange={e => set('site', e.target.value)} placeholder="www.empresa.com.br" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Segmento *</label>
              <select value={form.segmento} onChange={e => set('segmento', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="CONSTRUTORA">Construtora</option>
                <option value="INDUSTRIA_REFINARIA">Indústria / Refinaria</option>
                <option value="PORTO_LOGISTICA">Porto / Logística</option>
                <option value="PREFEITURA_GOVERNO">Prefeitura / Governo</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contatos */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Contatos</h2>
            <button type="button" onClick={addContato} className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg" style={{ color: '#FFAF06', background: '#FFF8E6' }}>
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>
          <div className="space-y-4">
            {contatos.map((c, i) => (
              <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: '#F9F7F4', border: '1px solid #E0DDD8' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{i === 0 ? 'Contato principal' : `Contato ${i + 1}`}</span>
                  {i > 0 && <button type="button" onClick={() => removeContato(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nome *</label>
                    <input value={c.nome} onChange={e => setContato(i, 'nome', e.target.value)} placeholder="Nome completo" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cargo</label>
                    <input value={c.cargo} onChange={e => setContato(i, 'cargo', e.target.value)} placeholder="Ex: Gerente de operações" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                    <input value={c.telefone} onChange={e => setContato(i, 'telefone', e.target.value)} placeholder="(81) 9 9000-0000" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">E-mail</label>
                    <input value={c.email} onChange={e => setContato(i, 'email', e.target.value)} placeholder="nome@empresa.com.br" type="email" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 cursor-pointer" title="Esse contato vai receber faturas e boletos por e-mail. Máximo 6 por cliente.">
                  <input
                    type="checkbox"
                    checked={!!c.recebeFatura}
                    onChange={() => toggleRecebeFatura(i)}
                    disabled={!c.email}
                    className="w-4 h-4"
                    style={{ accentColor: '#FFAF06' }}
                  />
                  <span className={`text-sm ${c.email ? 'text-gray-700' : 'text-gray-300'}`}>
                    📧 Recebe fatura/boleto por e-mail
                    {!c.email && <span className="text-xs"> (preenche o e-mail primeiro)</span>}
                  </span>
                </label>
              </div>
            ))}
            <p className="text-xs text-gray-400">
              Marca até <strong>4 contatos</strong> pra receber fatura/boleto automaticamente. O primeiro vai como destinatário principal, os demais como cópia.
            </p>
          </div>
        </div>

        {/* Endereços */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Endereço</h2>
            <button type="button" onClick={addEndereco} className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg" style={{ color: '#FFAF06', background: '#FFF8E6' }}>
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>
          <div className="space-y-4">
            {enderecos.map((e, i) => (
              <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: '#F9F7F4', border: '1px solid #E0DDD8' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{i === 0 ? 'Endereço principal' : `Endereço ${i + 1}`}</span>
                  {i > 0 && <button type="button" onClick={() => removeEndereco(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">CEP</label>
                    <div className="relative">
                      <input
                        value={e.cep}
                        onChange={ev => handleCepChange(i, ev.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className={inputCls}
                        style={inputStyle}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                      {cepBuscando[i] && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: '#FFAF06' }} />
                      )}
                    </div>
                    {cepErro[i] && (
                      <div className="mt-1 text-xs text-red-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {cepErro[i]}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Logradouro *</label>
                    <input value={e.logradouro} onChange={ev => setEndereco(i, 'logradouro', ev.target.value)} placeholder="Av., Rua, Rod..." className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Número</label>
                    <input value={e.numero} onChange={ev => setEndereco(i, 'numero', ev.target.value)} placeholder="123" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Complemento</label>
                    <input value={e.complemento} onChange={ev => setEndereco(i, 'complemento', ev.target.value)} placeholder="Sala, Bloco..." className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bairro</label>
                    <input value={e.bairro} onChange={ev => setEndereco(i, 'bairro', ev.target.value)} placeholder="Bairro" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cidade *</label>
                    <input value={e.cidade} onChange={ev => setEndereco(i, 'cidade', ev.target.value)} placeholder="Recife" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Estado</label>
                    <input value={e.estado} onChange={ev => setEndereco(i, 'estado', ev.target.value)} placeholder="PE" maxLength={2} className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Condições comerciais */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Condições comerciais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite de crédito (R$)</label>
              <input value={form.limiteCredito} onChange={e => set('limiteCredito', e.target.value)} type="number" placeholder="50000" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de pagamento (dias)</label>
              <input value={form.prazoPagemento} onChange={e => set('prazoPagemento', e.target.value)} type="number" placeholder="30" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Índice de reajuste</label>
              <select value={form.reajusteIndice} onChange={e => set('reajusteIndice', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="RENEGOCIAR">Renegociar</option>
                <option value="IPCA">IPCA</option>
                <option value="IGPM">IGPM</option>
                <option value="INPC">INPC</option>
                <option value="PERCENTUAL_FIXO">Percentual fixo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma de cobrança</label>
              <select value={form.formaCobranca} onChange={e => set('formaCobranca', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="BOLETO">Boleto</option>
                <option value="PIX">PIX</option>
                <option value="NF_TED">NF + TED</option>
                <option value="TRANSFERENCIA">Transferência</option>
              </select>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Observações</h2>
          <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Anotações sobre o cliente..." rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
        </div>

        {erro && <div className="p-3 rounded-xl text-red-700 text-sm" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>{erro}</div>}

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate('/clientes')} className="px-6 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all" style={{ border: '1px solid #E0DDD8' }}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl font-semibold text-gray-900 transition-all flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : (isEdit ? 'Salvar alterações' : 'Salvar cliente')}
          </button>
        </div>
      </form>
    </div>
  )
}
