import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2, AlertCircle, MapPin, Search } from 'lucide-react'
import { buscarCep, formatarCep, limparCep } from '../utils/cep'

const tiposEquipamento = [
  { v: 'CONTAINER_SECO', l: 'Container Seco' },
  { v: 'CONTAINER_REEFER', l: 'Container Reefer' },
  { v: 'CACAMBA_ESTACIONARIA', l: 'Caçamba Estacionária' },
  { v: 'CAMINHAO_MUNCK', l: 'Caminhão Munck' },
  { v: 'CAMINHAO_POLIGUINDASTE', l: 'Caminhão Poliguindaste' },
  { v: 'CAMINHAO_CAVALO_MECANICO', l: 'Caminhão Cavalo Mecânico' },
]

export default function EditarContrato() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [carregando, setCarregando] = useState(true)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    tipoModelo: 'CONTAINER_SECO',
    status: 'RASCUNHO',
    dtInicio: '',
    dtFim: '',
    valor: '',
    periodicidade: 'Mensal',
    reajuste: 'IPCA',
    formaCobranca: 'BOLETO',
    // Default PERSONALIZADO: usa periodicidade + diaVencFatura (caso de aluguel mensal recorrente).
    // D_30/A_VISTA/PARCELADO geram UMA fatura só, ignorando diaVencFatura.
    condicaoPagamento: 'PERSONALIZADO',
    diaVencFatura: '5',
    dtPrimeiraFatura: '', // opcional — cravado em calendário
    inadimpDias: '30',
    multaRescisaoPct: '',
    multaAtrasoPct: '',
    jurosMesPct: '',
    avisoPrevioDias: '30',
    mobilizacaoValor: '',
    desmobilizacaoValor: '',
    localMobilizacao: '',
    manutRespLocador: true,
    foro: 'Recife/PE',
    observacoes: '',
  })
  const [contrato, setContrato] = useState<any>(null)
  // Endereço estruturado pra preencher localMobilizacao via CEP
  const [endMob, setEndMob] = useState({
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  })
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erroCep, setErroCep] = useState('')

  const setMob = (k: string, v: string) => setEndMob((s) => ({ ...s, [k]: v }))

  // Monta a string sempre que algum campo estruturado mudar (e há conteúdo)
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
        }))
      } catch (e: any) {
        setErroCep(e.message || 'CEP não encontrado')
      } finally {
        setBuscandoCep(false)
      }
    }
  }

  useEffect(() => {
    if (!id) return
    api.get(`/contratos/${id}`)
      .then((r) => {
        const c = r.data
        setContrato(c)
        setForm({
          tipoModelo: c.tipoModelo || 'CONTAINER_SECO',
          status: c.status || 'RASCUNHO',
          dtInicio: c.dtInicio ? new Date(c.dtInicio).toISOString().slice(0, 10) : '',
          dtFim: c.dtFim ? new Date(c.dtFim).toISOString().slice(0, 10) : '',
          valor: c.valor != null ? String(Number(c.valor)) : '',
          periodicidade: c.periodicidade || 'Mensal',
          reajuste: c.reajuste || 'IPCA',
          formaCobranca: c.formaCobranca || 'BOLETO',
          condicaoPagamento: c.condicaoPagamento || 'PERSONALIZADO',
          diaVencFatura: String(c.diaVencFatura ?? 5),
          dtPrimeiraFatura: c.dtPrimeiraFatura ? String(c.dtPrimeiraFatura).slice(0, 10) : '',
          inadimpDias: String(c.inadimpDias ?? 30),
          multaRescisaoPct: c.multaRescisaoPct != null ? String(Number(c.multaRescisaoPct)) : '',
          multaAtrasoPct: c.multaAtrasoPct != null ? String(Number(c.multaAtrasoPct)) : '',
          jurosMesPct: c.jurosMesPct != null ? String(Number(c.jurosMesPct)) : '',
          avisoPrevioDias: String(c.avisoPrevioDias ?? 30),
          mobilizacaoValor: c.mobilizacaoValor != null ? String(Number(c.mobilizacaoValor)) : '',
          desmobilizacaoValor: c.desmobilizacaoValor != null ? String(Number(c.desmobilizacaoValor)) : '',
          localMobilizacao: c.localMobilizacao || '',
          manutRespLocador: c.manutRespLocador !== false,
          foro: c.foro || 'Recife/PE',
          observacoes: c.observacoes || '',
        })
      })
      .finally(() => setCarregando(false))
  }, [id])

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.dtInicio || !form.dtFim) return setErro('Informe as datas.')
    if (new Date(form.dtFim) <= new Date(form.dtInicio)) return setErro('Data de fim deve ser posterior à de início.')
    if (!form.valor || Number(form.valor) <= 0) return setErro('Valor inválido.')
    setLoading(true)
    try {
      const r = await api.put(`/contratos/${id}`, {
        ...form,
        valor: Number(form.valor),
        diaVencFatura: Number(form.diaVencFatura) || 5,
        dtPrimeiraFatura: form.dtPrimeiraFatura || null,
        inadimpDias: Number(form.inadimpDias) || 30,
        avisoPrevioDias: Number(form.avisoPrevioDias) || 30,
        multaRescisaoPct: form.multaRescisaoPct ? Number(form.multaRescisaoPct) : null,
        multaAtrasoPct: form.multaAtrasoPct ? Number(form.multaAtrasoPct) : null,
        jurosMesPct: form.jurosMesPct ? Number(form.jurosMesPct) : null,
        mobilizacaoValor: form.mobilizacaoValor ? Number(form.mobilizacaoValor) : null,
        desmobilizacaoValor: form.desmobilizacaoValor ? Number(form.desmobilizacaoValor) : null,
        localMobilizacao: form.localMobilizacao || null,
        observacoes: form.observacoes || null,
      })
      // Backend agora auto-recalcula faturas quando muda dia/condição/datas/valor —
      // avisa o usuário se isso aconteceu pra ele não se assustar.
      const n = r.data?._faturasRecalculadas
      if (typeof n === 'number' && n > 0) {
        alert(`Contrato salvo. ${n} fatura(s) pendente(s) foram recalculadas automaticamente com as novas regras.`)
      }
      navigate(`/contratos/${id}`)
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao salvar alterações.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }
  const onFocus = (e: any) => (e.target.style.borderColor = '#FFAF06')
  const onBlur = (e: any) => (e.target.style.borderColor = '#E0DDD8')

  if (carregando) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="p-8 max-w-3xl animate-fade-in">
      <button onClick={() => navigate(`/contratos/${id}`)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all">
        <ArrowLeft className="w-4 h-4" /> Voltar para o contrato
      </button>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Editar contrato {contrato?.numero}</h1>
        <p className="text-gray-500 text-sm mt-1">Cliente: {contrato?.cliente?.razaoSocial}. Equipamentos vinculados não são alterados aqui — use renovação para alterar valor/data com histórico.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Tipo e vigência</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipoModelo} onChange={(e) => set('tipoModelo', e.target.value)} className={inputCls} style={inputStyle}>
                {tiposEquipamento.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="RASCUNHO">Rascunho</option>
                <option value="AGUARDANDO_ASSINATURA">Aguardando assinatura</option>
                <option value="ATIVO">Ativo</option>
                <option value="VENCENDO">Vencendo</option>
                <option value="ENCERRADO">Encerrado</option>
                <option value="RESCINDIDO">Rescindido</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de início *</label>
              <input value={form.dtInicio} onChange={(e) => set('dtInicio', e.target.value)} type="date" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de fim *</label>
              <input value={form.dtFim} onChange={(e) => set('dtFim', e.target.value)} type="date" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Valor e cobrança</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input value={form.valor} onChange={(e) => set('valor', e.target.value)} type="number" step="0.01" min="0" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodicidade</label>
              <select value={form.periodicidade} onChange={(e) => set('periodicidade', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="Mensal">Mensal</option>
                <option value="Quinzenal">Quinzenal</option>
                <option value="Semanal">Semanal</option>
                <option value="Diária">Diária</option>
                <option value="Único">Pagamento único</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma de cobrança</label>
              <select value={form.formaCobranca} onChange={(e) => set('formaCobranca', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="BOLETO">Boleto</option>
                <option value="PIX">PIX</option>
                <option value="NF_TED">NF + TED</option>
                <option value="TRANSFERENCIA">Transferência</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condição de pagamento</label>
              <select value={form.condicaoPagamento} onChange={(e) => set('condicaoPagamento', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="A_VISTA">À vista (no início)</option>
                <option value="D_15">D+15 dias</option>
                <option value="D_30">D+30 dias</option>
                <option value="D_45">D+45 dias</option>
                <option value="D_60">D+60 dias</option>
                <option value="PARCELADO_30_60">Parcelado 30/60</option>
                <option value="PARCELADO_30_60_90">Parcelado 30/60/90</option>
                <option value="PERSONALIZADO">Personalizado (usa periodicidade)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Define como as faturas são geradas. Clique "Recalcular faturas" no contrato depois de mudar.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia de vencimento</label>
              <input value={form.diaVencFatura} onChange={(e) => set('diaVencFatura', e.target.value)} type="number" min="1" max="31" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data da primeira fatura <span className="text-xs text-gray-400">(opcional)</span></label>
              <input
                type="date"
                value={form.dtPrimeiraFatura}
                onChange={(e) => set('dtPrimeiraFatura', e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
              <p className="text-xs text-gray-500 mt-1">Sobrepõe o cálculo automático; as próximas seguem o "Dia de vencimento".</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Índice de reajuste</label>
              <select value={form.reajuste} onChange={(e) => set('reajuste', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="RENEGOCIAR">Renegociar</option>
                <option value="IPCA">IPCA</option>
                <option value="IGPM">IGPM</option>
                <option value="INPC">INPC</option>
                <option value="PERCENTUAL_FIXO">Percentual fixo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inadimplência após (dias)</label>
              <input value={form.inadimpDias} onChange={(e) => set('inadimpDias', e.target.value)} type="number" min="0" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Cláusulas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Multa por rescisão (%)</label>
              <input value={form.multaRescisaoPct} onChange={(e) => set('multaRescisaoPct', e.target.value)} type="number" step="0.01" min="0" max="100" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foro</label>
              <input value={form.foro} onChange={(e) => set('foro', e.target.value)} className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 mt-1">
              <input id="manut" type="checkbox" checked={form.manutRespLocador} onChange={(e) => set('manutRespLocador', e.target.checked)} className="w-4 h-4" style={{ accentColor: '#FFAF06' }} />
              <label htmlFor="manut" className="text-sm text-gray-700">Manutenção sob responsabilidade do locador (Alfer)</label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: '#FFAF06' }} /> Local de mobilização
          </h2>
          <p className="text-xs text-gray-500 mb-4">Onde os equipamentos serão entregues. Pode preencher por CEP ou editar diretamente.</p>

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
            <label className="block text-xs text-gray-500 mb-1">Endereço completo (pode editar à mão)</label>
            <textarea
              value={form.localMobilizacao}
              onChange={(e) => set('localMobilizacao', e.target.value)}
              rows={2}
              placeholder="Atual no contrato — pode colar/editar livremente"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Mobilização / Desmobilização (valores)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor mobilização por equipamento (R$)</label>
              <input value={form.mobilizacaoValor} onChange={(e) => set('mobilizacaoValor', e.target.value)} type="number" step="0.01" min="0" placeholder="Ex: 1500,00" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor desmobilização por equipamento (R$)</label>
              <input value={form.desmobilizacaoValor} onChange={(e) => set('desmobilizacaoValor', e.target.value)} type="number" step="0.01" min="0" placeholder="Ex: 1500,00" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Aparece no PDF do contrato. Multiplicado pela quantidade de equipamentos vinculados.</p>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Multas e juros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Multa por atraso (%)</label>
              <input value={form.multaAtrasoPct} onChange={(e) => set('multaAtrasoPct', e.target.value)} type="number" step="0.01" min="0" max="100" placeholder="Ex: 2" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Juros ao mês (%)</label>
              <input value={form.jurosMesPct} onChange={(e) => set('jurosMesPct', e.target.value)} type="number" step="0.01" min="0" max="100" placeholder="Ex: 1" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aviso prévio (dias)</label>
              <input value={form.avisoPrevioDias} onChange={(e) => set('avisoPrevioDias', e.target.value)} type="number" min="0" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Observações</h2>
          <textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
        </div>

        {erro && (<div className="p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}><AlertCircle className="w-4 h-4" /> {erro}</div>)}

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate(`/contratos/${id}`)} className="px-6 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>) : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
