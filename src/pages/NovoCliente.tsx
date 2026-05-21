import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NovoCliente() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    razaoSocial: '',
    cnpj: '',
    inscricaoEstadual: '',
    site: '',
    segmento: 'CONSTRUTORA',
    limiteCredito: '',
    prazoPagemento: '30',
    reajusteIndice: 'IPCA',
    formaCobranca: 'BOLETO',
    observacoes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await api.post('/clientes', {
        ...form,
        limiteCredito: form.limiteCredito ? Number(form.limiteCredito) : undefined,
        prazoPagemento: Number(form.prazoPagemento),
      })
      navigate('/clientes')
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao cadastrar cliente.')
    } finally {
      setLoading(false)
    }
  }

  const campo = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white"
        style={{ border: '1px solid #E0DDD8' }}
        onFocus={e => e.target.style.borderColor = '#FFAF06'}
        onBlur={e => e.target.style.borderColor = '#E0DDD8'}
      />
    </div>
  )

  const select = (label: string, key: string, options: { value: string; label: string }[]) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={(form as any)[key]}
        onChange={e => set(key, e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white"
        style={{ border: '1px solid #E0DDD8' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div className="p-8 max-w-3xl animate-fade-in">
      <button onClick={() => navigate('/clientes')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all">
        <ArrowLeft className="w-4 h-4" />
        Voltar para clientes
      </button>

      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Novo cliente</h1>
        <p className="text-gray-500 text-sm mt-1">Preencha os dados do novo cliente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados principais */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Dados principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              {campo('Razão social *', 'razaoSocial', 'text', 'Nome da empresa')}
            </div>
            {campo('CNPJ *', 'cnpj', 'text', '00.000.000/0001-00')}
            {campo('Inscrição estadual', 'inscricaoEstadual', 'text', 'Opcional')}
            {campo('Site', 'site', 'text', 'www.empresa.com.br')}
            {select('Segmento *', 'segmento', [
              { value: 'CONSTRUTORA', label: 'Construtora' },
              { value: 'INDUSTRIA_REFINARIA', label: 'Indústria / Refinaria' },
              { value: 'PORTO_LOGISTICA', label: 'Porto / Logística' },
              { value: 'PREFEITURA_GOVERNO', label: 'Prefeitura / Governo' },
              { value: 'OUTROS', label: 'Outros' },
            ])}
          </div>
        </div>

        {/* Condições comerciais */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Condições comerciais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campo('Limite de crédito (R$)', 'limiteCredito', 'number', '50000')}
            {campo('Prazo de pagamento (dias)', 'prazoPagemento', 'number', '30')}
            {select('Índice de reajuste', 'reajusteIndice', [
              { value: 'RENEGOCIAR', label: 'Renegociar' },
              { value: 'IPCA', label: 'IPCA' },
              { value: 'IGPM', label: 'IGPM' },
              { value: 'INPC', label: 'INPC' },
              { value: 'PERCENTUAL_FIXO', label: 'Percentual fixo' },
            ])}
            {select('Forma de cobrança', 'formaCobranca', [
              { value: 'BOLETO', label: 'Boleto' },
              { value: 'PIX', label: 'PIX' },
              { value: 'NF_TED', label: 'NF + TED' },
              { value: 'TRANSFERENCIA', label: 'Transferência' },
            ])}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Observações</h2>
          <textarea
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
            placeholder="Anotações sobre o cliente..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
            style={{ border: '1px solid #E0DDD8' }}
          />
        </div>

        {erro && (
          <div className="p-3 rounded-xl text-red-700 text-sm" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
            {erro}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/clientes')}
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
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Salvar cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}
