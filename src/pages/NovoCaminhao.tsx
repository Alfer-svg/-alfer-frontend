import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

const tipos = [
  { v: 'MUNCK', l: 'Munck' },
  { v: 'POLIGUINDASTE', l: 'Poliguindaste' },
  { v: 'CAVALO_MECANICO', l: 'Cavalo Mecânico' },
]

export default function NovoCaminhao() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    codigo: '',
    tipo: 'MUNCK',
    modelo: '',
    placa: '',
    ano: String(new Date().getFullYear()),
    capacidade: '',
    kmAtual: '0',
    proxManutKm: '',
    status: 'DISPONIVEL',
    observacoes: '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.codigo || !form.modelo || !form.placa || !form.capacidade) {
      return setErro('Preencha código, placa, modelo e capacidade.')
    }
    setLoading(true)
    try {
      await api.post('/caminhoes', {
        ...form,
        ano: Number(form.ano),
        kmAtual: Number(form.kmAtual || 0),
        proxManutKm: form.proxManutKm ? Number(form.proxManutKm) : null,
        observacoes: form.observacoes || null,
      })
      navigate('/caminhoes')
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao cadastrar caminhão.')
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
        onClick={() => navigate('/caminhoes')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para caminhões
      </button>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Novo caminhão</h1>
        <p className="text-gray-500 text-sm mt-1">Cadastre um caminhão da frota</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Identificação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input value={form.codigo} onChange={(e) => set('codigo', e.target.value)} placeholder="Ex: CAM-001" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa *</label>
              <input value={form.placa} onChange={(e) => set('placa', e.target.value.toUpperCase())} placeholder="ABC-1D23" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className={inputCls} style={inputStyle}>
                {tipos.map((t) => (<option key={t.v} value={t.v}>{t.l}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <input value={form.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="Ex: Volvo FH 540" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <input value={form.ano} onChange={(e) => set('ano', e.target.value)} type="number" min="1980" max="2100" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade *</label>
              <input value={form.capacidade} onChange={(e) => set('capacidade', e.target.value)} placeholder="Ex: 45t" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status inicial</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="DISPONIVEL">Disponível</option>
                <option value="EM_OPERACAO">Em operação</option>
                <option value="MANUTENCAO">Em manutenção</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Quilometragem e manutenção</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KM atual</label>
              <input value={form.kmAtual} onChange={(e) => set('kmAtual', e.target.value)} type="number" min="0" placeholder="0" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Próxima manutenção (km)</label>
              <input value={form.proxManutKm} onChange={(e) => set('proxManutKm', e.target.value)} type="number" min="0" placeholder="Opcional" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Observações</h2>
          <textarea
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
            placeholder="Anotações sobre o caminhão..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
            style={inputStyle}
          />
        </div>

        {erro && (
          <div className="p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erro}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate('/caminhoes')} className="px-6 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all" style={{ border: '1px solid #E0DDD8' }}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-semibold text-gray-900 transition-all flex items-center justify-center gap-2"
            style={{ background: loading ? '#CC8C00' : '#FFAF06' }}
          >
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>) : 'Salvar caminhão'}
          </button>
        </div>
      </form>
    </div>
  )
}
