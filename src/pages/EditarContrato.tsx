import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

const tiposEquipamento = [
  { v: 'CONTAINER_SECO', l: 'Container Seco' },
  { v: 'CONTAINER_REEFER', l: 'Container Reefer' },
  { v: 'CACAMBA_ESTACIONARIA', l: 'Caçamba Estacionária' },
  { v: 'CAMINHAO_MUNCK', l: 'Caminhão Munck' },
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
    diaVencFatura: '5',
    inadimpDias: '30',
    multaRescisaoPct: '',
    manutRespLocador: true,
    foro: 'Recife/PE',
    observacoes: '',
  })
  const [contrato, setContrato] = useState<any>(null)

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
          diaVencFatura: String(c.diaVencFatura ?? 5),
          inadimpDias: String(c.inadimpDias ?? 30),
          multaRescisaoPct: c.multaRescisaoPct != null ? String(Number(c.multaRescisaoPct)) : '',
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
      await api.put(`/contratos/${id}`, {
        ...form,
        valor: Number(form.valor),
        diaVencFatura: Number(form.diaVencFatura) || 5,
        inadimpDias: Number(form.inadimpDias) || 30,
        multaRescisaoPct: form.multaRescisaoPct ? Number(form.multaRescisaoPct) : null,
        observacoes: form.observacoes || null,
      })
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia de vencimento</label>
              <input value={form.diaVencFatura} onChange={(e) => set('diaVencFatura', e.target.value)} type="number" min="1" max="31" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
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
