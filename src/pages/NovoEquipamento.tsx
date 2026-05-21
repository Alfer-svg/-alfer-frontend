import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

const tipos = [
  { v: 'CONTAINER_SECO', l: 'Container Seco' },
  { v: 'CONTAINER_REEFER', l: 'Container Reefer' },
  { v: 'CACAMBA_ESTACIONARIA', l: 'Caçamba Estacionária' },
  { v: 'CAMINHAO_MUNCK', l: 'Caminhão Munck' },
]

export default function NovoEquipamento() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    codigo: '',
    tipo: 'CONTAINER_SECO',
    modelo: '',
    capacidade: '',
    ano: String(new Date().getFullYear()),
    status: 'DISPONIVEL',
    localizacao: '',
    horimetro: '',
    proxManutHs: '',
    ultimaManut: '',
    observacoes: '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.codigo || !form.modelo || !form.capacidade) return setErro('Preencha código, modelo e capacidade.')
    setLoading(true)
    try {
      await api.post('/equipamentos', {
        ...form,
        ano: Number(form.ano),
        horimetro: form.horimetro ? Number(form.horimetro) : null,
        proxManutHs: form.proxManutHs ? Number(form.proxManutHs) : null,
        ultimaManut: form.ultimaManut || null,
        localizacao: form.localizacao || null,
        observacoes: form.observacoes || null,
      })
      navigate('/equipamentos')
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao cadastrar equipamento.')
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
        onClick={() => navigate('/equipamentos')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para equipamentos
      </button>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Novo equipamento</h1>
        <p className="text-gray-500 text-sm mt-1">Cadastre um container, caçamba ou outro equipamento da frota</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Identificação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input
                value={form.codigo}
                onChange={(e) => set('codigo', e.target.value)}
                placeholder="Ex: CS-001"
                required
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={form.tipo}
                onChange={(e) => set('tipo', e.target.value)}
                className={inputCls}
                style={inputStyle}
              >
                {tipos.map((t) => (
                  <option key={t.v} value={t.v}>{t.l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <input
                value={form.modelo}
                onChange={(e) => set('modelo', e.target.value)}
                placeholder="Ex: 20ft Dry Standard"
                required
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade *</label>
              <input
                value={form.capacidade}
                onChange={(e) => set('capacidade', e.target.value)}
                placeholder="Ex: 28 toneladas / 33 m³"
                required
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <input
                value={form.ano}
                onChange={(e) => set('ano', e.target.value)}
                type="number"
                min="1980"
                max="2100"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status inicial</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={inputCls}
                style={inputStyle}
              >
                <option value="DISPONIVEL">Disponível</option>
                <option value="LOCADO">Locado</option>
                <option value="MANUTENCAO">Em manutenção</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Localização atual</label>
              <input
                value={form.localizacao}
                onChange={(e) => set('localizacao', e.target.value)}
                placeholder="Ex: Pátio Recife, Cliente XYZ..."
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Manutenção</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horímetro atual</label>
              <input
                value={form.horimetro}
                onChange={(e) => set('horimetro', e.target.value)}
                type="number"
                min="0"
                placeholder="horas"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Próx. manut. (h)</label>
              <input
                value={form.proxManutHs}
                onChange={(e) => set('proxManutHs', e.target.value)}
                type="number"
                min="0"
                placeholder="horas"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Última manutenção</label>
              <input
                value={form.ultimaManut}
                onChange={(e) => set('ultimaManut', e.target.value)}
                type="date"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Observações</h2>
          <textarea
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
            placeholder="Notas adicionais sobre o equipamento..."
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
            onClick={() => navigate('/equipamentos')}
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
              'Salvar equipamento'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
