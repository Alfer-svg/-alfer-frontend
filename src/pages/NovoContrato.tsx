import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2, AlertCircle, Package } from 'lucide-react'

const tiposEquipamento = [
  { v: 'CONTAINER_SECO', l: 'Container Seco' },
  { v: 'CONTAINER_REEFER', l: 'Container Reefer' },
  { v: 'CACAMBA_ESTACIONARIA', l: 'Caçamba Estacionária' },
  { v: 'CAMINHAO_MUNCK', l: 'Caminhão Munck' },
]

export default function NovoContrato() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [clientes, setClientes] = useState<any[]>([])
  const [carregandoClientes, setCarregandoClientes] = useState(true)
  const [equipamentosDisp, setEquipamentosDisp] = useState<any[]>([])
  const [equipamentosSel, setEquipamentosSel] = useState<string[]>([])
  const [form, setForm] = useState({
    clienteId: '',
    tipoModelo: 'CONTAINER_SECO',
    status: 'RASCUNHO',
    dtInicio: '',
    dtFim: '',
    valor: '',
    periodicidade: 'Mensal',
    reajuste: 'IPCA',
    formaCobranca: 'BOLETO',
    diaVencFatura: '5',
    alertaDias: '30',
    segundoAlertaDias: '15',
    multaRescisaoPct: '',
    inadimpDias: '30',
    manutRespLocador: true,
    foro: 'Recife/PE',
    observacoes: '',
  })

  useEffect(() => {
    api.get('/clientes')
      .then((r) => setClientes(r.data))
      .catch(() => setClientes([]))
      .finally(() => setCarregandoClientes(false))
  }, [])

  useEffect(() => {
    api.get('/equipamentos', { params: { tipo: form.tipoModelo, status: 'DISPONIVEL' } })
      .then((r) => setEquipamentosDisp(r.data))
      .catch(() => setEquipamentosDisp([]))
    setEquipamentosSel([])
  }, [form.tipoModelo])

  const toggleEquip = (id: string) => {
    setEquipamentosSel((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id])
  }

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const calcDuracao = () => {
    if (!form.dtInicio || !form.dtFim) return null
    const ini = new Date(form.dtInicio).getTime()
    const fim = new Date(form.dtFim).getTime()
    if (fim <= ini) return null
    const dias = Math.ceil((fim - ini) / 86400000)
    const meses = Math.round(dias / 30)
    return { dias, meses }
  }
  const duracao = calcDuracao()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')

    if (!form.clienteId) return setErro('Selecione um cliente.')
    if (!form.dtInicio || !form.dtFim) return setErro('Informe as datas de início e fim.')
    if (new Date(form.dtFim) <= new Date(form.dtInicio)) return setErro('A data de fim deve ser posterior à de início.')
    if (!form.valor || Number(form.valor) <= 0) return setErro('Informe um valor válido.')

    setLoading(true)
    try {
      const payload: any = {
        clienteId: form.clienteId,
        tipoModelo: form.tipoModelo,
        status: form.status,
        dtInicio: form.dtInicio,
        dtFim: form.dtFim,
        valor: Number(form.valor),
        periodicidade: form.periodicidade,
        reajuste: form.reajuste,
        formaCobranca: form.formaCobranca,
        diaVencFatura: Number(form.diaVencFatura) || 5,
        alertaDias: Number(form.alertaDias) || 30,
        inadimpDias: Number(form.inadimpDias) || 30,
        manutRespLocador: form.manutRespLocador,
        foro: form.foro,
        observacoes: form.observacoes || undefined,
      }
      if (form.segundoAlertaDias) payload.segundoAlertaDias = Number(form.segundoAlertaDias)
      if (form.multaRescisaoPct) payload.multaRescisaoPct = Number(form.multaRescisaoPct)
      if (equipamentosSel.length) payload.equipamentosIds = equipamentosSel

      await api.post('/contratos', payload)
      navigate('/contratos')
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao cadastrar contrato.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }
  const onFocus = (e: any) => (e.target.style.borderColor = '#FFAF06')
  const onBlur = (e: any) => (e.target.style.borderColor = '#E0DDD8')

  return (
    <div className="p-8 max-w-3xl animate-fade-in">
      <button
        onClick={() => navigate('/contratos')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para contratos
      </button>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Novo contrato</h1>
        <p className="text-gray-500 text-sm mt-1">Preencha os dados para gerar um novo contrato de locação</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Cliente</h2>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o cliente *</label>
          <select
            value={form.clienteId}
            onChange={(e) => set('clienteId', e.target.value)}
            required
            disabled={carregandoClientes}
            className={inputCls}
            style={inputStyle}
          >
            <option value="">
              {carregandoClientes ? 'Carregando clientes...' : 'Selecione um cliente'}
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razaoSocial} {c.cnpj ? `— ${c.cnpj}` : ''}
              </option>
            ))}
          </select>
          {!carregandoClientes && clientes.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Nenhum cliente cadastrado.{' '}
              <button
                type="button"
                onClick={() => navigate('/clientes/novo')}
                className="font-medium"
                style={{ color: '#FFAF06' }}
              >
                Cadastrar agora
              </button>
            </p>
          )}
        </div>

        {/* Tipo de equipamento */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Tipo de equipamento</h2>
          <div className="grid grid-cols-2 gap-3">
            {tiposEquipamento.map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => set('tipoModelo', v)}
                className="py-3 px-4 rounded-xl text-sm font-semibold transition-all text-left"
                style={{
                  background: form.tipoModelo === v ? '#FFAF06' : '#F5F0EB',
                  color: form.tipoModelo === v ? '#1A1C1E' : '#888',
                  border: form.tipoModelo === v ? '2px solid #FFAF06' : '2px solid transparent',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Equipamentos */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Package className="w-4 h-4" /> Equipamentos a vincular</h2>
            {equipamentosSel.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#FFF8E6', color: '#FFAF06' }}>
                {equipamentosSel.length} selecionado(s)
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">Apenas equipamentos disponíveis do tipo escolhido aparecem aqui. Opcional.</p>
          {equipamentosDisp.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">
              Nenhum equipamento disponível deste tipo.{' '}
              <button type="button" onClick={() => navigate('/equipamentos/novo')} className="font-medium" style={{ color: '#FFAF06' }}>
                Cadastrar
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {equipamentosDisp.map((eq) => {
                const sel = equipamentosSel.includes(eq.id)
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => toggleEquip(eq.id)}
                    className="w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all"
                    style={{
                      background: sel ? '#FFF8E6' : '#F9F7F4',
                      border: sel ? '2px solid #FFAF06' : '2px solid transparent',
                    }}
                  >
                    <Package className="w-4 h-4" style={{ color: sel ? '#FFAF06' : '#888' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{eq.codigo} — {eq.modelo}</div>
                      <div className="text-xs text-gray-500">{eq.capacidade} • Ano {eq.ano}</div>
                    </div>
                    <input type="checkbox" checked={sel} readOnly className="w-4 h-4" style={{ accentColor: '#FFAF06' }} />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Vigência */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Vigência</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de início *</label>
              <input
                value={form.dtInicio}
                onChange={(e) => set('dtInicio', e.target.value)}
                type="date"
                required
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de fim *</label>
              <input
                value={form.dtFim}
                onChange={(e) => set('dtFim', e.target.value)}
                type="date"
                required
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </div>
          {duracao && (
            <p className="text-xs text-gray-500 mt-3">
              Duração total: <strong>{duracao.dias} dias</strong> (~{duracao.meses}{' '}
              {duracao.meses === 1 ? 'mês' : 'meses'})
            </p>
          )}
        </div>

        {/* Valor e cobrança */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Valor e cobrança</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input
                value={form.valor}
                onChange={(e) => set('valor', e.target.value)}
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="12000.00"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodicidade</label>
              <select
                value={form.periodicidade}
                onChange={(e) => set('periodicidade', e.target.value)}
                className={inputCls}
                style={inputStyle}
              >
                <option value="Mensal">Mensal</option>
                <option value="Quinzenal">Quinzenal</option>
                <option value="Semanal">Semanal</option>
                <option value="Diária">Diária</option>
                <option value="Único">Pagamento único</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma de cobrança</label>
              <select
                value={form.formaCobranca}
                onChange={(e) => set('formaCobranca', e.target.value)}
                className={inputCls}
                style={inputStyle}
              >
                <option value="BOLETO">Boleto</option>
                <option value="PIX">PIX</option>
                <option value="NF_TED">NF + TED</option>
                <option value="TRANSFERENCIA">Transferência</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia de vencimento da fatura</label>
              <input
                value={form.diaVencFatura}
                onChange={(e) => set('diaVencFatura', e.target.value)}
                type="number"
                min="1"
                max="31"
                placeholder="5"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Índice de reajuste</label>
              <select
                value={form.reajuste}
                onChange={(e) => set('reajuste', e.target.value)}
                className={inputCls}
                style={inputStyle}
              >
                <option value="RENEGOCIAR">Renegociar</option>
                <option value="IPCA">IPCA</option>
                <option value="IGPM">IGPM</option>
                <option value="INPC">INPC</option>
                <option value="PERCENTUAL_FIXO">Percentual fixo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inadimplência após (dias)</label>
              <input
                value={form.inadimpDias}
                onChange={(e) => set('inadimpDias', e.target.value)}
                type="number"
                min="0"
                placeholder="30"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </div>
        </div>

        {/* Alertas de vencimento */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4" style={{ color: '#FFAF06' }} />
            <h2 className="font-semibold text-gray-900">Alertas de vencimento</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Quantos dias antes do fim do contrato você deseja ser notificado para iniciar a renovação.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">1º alerta (dias antes) *</label>
              <input
                value={form.alertaDias}
                onChange={(e) => set('alertaDias', e.target.value)}
                type="number"
                min="1"
                placeholder="30"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">2º alerta (dias antes)</label>
              <input
                value={form.segundoAlertaDias}
                onChange={(e) => set('segundoAlertaDias', e.target.value)}
                type="number"
                min="1"
                placeholder="15"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </div>
        </div>

        {/* Cláusulas */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Cláusulas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Multa por rescisão (%)</label>
              <input
                value={form.multaRescisaoPct}
                onChange={(e) => set('multaRescisaoPct', e.target.value)}
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="20.00"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foro</label>
              <input
                value={form.foro}
                onChange={(e) => set('foro', e.target.value)}
                placeholder="Recife/PE"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 mt-1">
              <input
                id="manut"
                type="checkbox"
                checked={form.manutRespLocador}
                onChange={(e) => set('manutRespLocador', e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#FFAF06' }}
              />
              <label htmlFor="manut" className="text-sm text-gray-700">
                Manutenção sob responsabilidade do locador (Alfer)
              </label>
            </div>
          </div>
        </div>

        {/* Status inicial */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Status inicial</h2>
          <div className="flex gap-3 flex-wrap">
            {[
              { v: 'RASCUNHO', l: 'Rascunho' },
              { v: 'AGUARDANDO_ASSINATURA', l: 'Aguardando assinatura' },
              { v: 'ATIVO', l: 'Ativo' },
            ].map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => set('status', v)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: form.status === v ? '#FFAF06' : '#F5F0EB',
                  color: form.status === v ? '#1A1C1E' : '#888',
                  border: form.status === v ? '2px solid #FFAF06' : '2px solid transparent',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Observações</h2>
          <textarea
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
            placeholder="Anotações específicas sobre o contrato..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
            style={inputStyle}
          />
        </div>

        {erro && (
          <div
            className="p-3 rounded-xl text-red-700 text-sm flex items-center gap-2"
            style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {erro}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/contratos')}
            className="px-6 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
            style={{ border: '1px solid #E0DDD8' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-semibold text-gray-900 transition-all flex items-center justify-center gap-2"
            style={{ background: loading ? '#CC8C00' : '#FFAF06' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar contrato'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
