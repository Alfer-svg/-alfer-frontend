import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

export default function NovaLocacaoCacamba() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<any[]>([])
  const [cacambas, setCacambas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    clienteId: '',
    cacambaId: '',
    endEntrega: '',
    dtEntrega: new Date().toISOString().slice(0, 10),
    prazoDias: '7',
    residuoAutorizado: 'CLASSE_A',
    valorLocacao: '',
    valorTroca: '',
    observacoes: '',
  })

  useEffect(() => {
    Promise.all([
      api.get('/clientes'),
      api.get('/equipamentos', { params: { tipo: 'CACAMBA_ESTACIONARIA', status: 'DISPONIVEL' } }),
    ]).then(([c, e]) => {
      setClientes(c.data)
      setCacambas(e.data)
    })
  }, [])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.clienteId || !form.cacambaId || !form.endEntrega) {
      return setErro('Cliente, caçamba e endereço são obrigatórios.')
    }
    setLoading(true)
    try {
      await api.post('/cacambas/locacoes', {
        ...form,
        prazoDias: Number(form.prazoDias),
        valorLocacao: form.valorLocacao ? Number(form.valorLocacao) : null,
        valorTroca: form.valorTroca ? Number(form.valorTroca) : null,
        observacoes: form.observacoes || null,
      })
      navigate('/cacambas')
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao criar locação.')
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
      <button onClick={() => navigate('/cacambas')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all">
        <ArrowLeft className="w-4 h-4" /> Voltar para caçambas
      </button>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Nova locação de caçamba</h1>
        <p className="text-gray-500 text-sm mt-1">Registre a entrega de uma caçamba para um cliente</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Cliente e caçamba</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select value={form.clienteId} onChange={(e) => set('clienteId', e.target.value)} required className={inputCls} style={inputStyle}>
                <option value="">Selecione</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.razaoSocial}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caçamba disponível *</label>
              <select value={form.cacambaId} onChange={(e) => set('cacambaId', e.target.value)} required className={inputCls} style={inputStyle}>
                <option value="">Selecione</option>
                {cacambas.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.modelo} ({c.capacidade})</option>)}
              </select>
              {cacambas.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Nenhuma caçamba disponível.{' '}
                  <button type="button" onClick={() => navigate('/equipamentos/novo')} className="font-medium" style={{ color: '#FFAF06' }}>
                    Cadastrar
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Entrega</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço de entrega *</label>
              <input value={form.endEntrega} onChange={(e) => set('endEntrega', e.target.value)} required placeholder="Rua, número, bairro, cidade..." className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de entrega *</label>
                <input value={form.dtEntrega} onChange={(e) => set('dtEntrega', e.target.value)} type="date" required className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (dias)</label>
                <input value={form.prazoDias} onChange={(e) => set('prazoDias', e.target.value)} type="number" min="1" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resíduo autorizado *</label>
                <select value={form.residuoAutorizado} onChange={(e) => set('residuoAutorizado', e.target.value)} className={inputCls} style={inputStyle}>
                  <option value="CLASSE_A">Classe A (entulho)</option>
                  <option value="CLASSE_B">Classe B (reciclável)</option>
                  <option value="CLASSE_C">Classe C (sem destino)</option>
                  <option value="CLASSE_D">Classe D (perigoso)</option>
                  <option value="MISTO">Misto</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Valor cobrado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor da locação (R$)</label>
              <input
                value={form.valorLocacao}
                onChange={(e) => set('valorLocacao', e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 300,00 — cobrado uma vez na entrega"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <p className="text-xs text-gray-500 mt-1">Cobrado uma única vez. Entra no fechamento junto com as trocas.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor por troca (R$)</label>
              <input
                value={form.valorTroca}
                onChange={(e) => set('valorTroca', e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 150,00 — por troca"
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <p className="text-xs text-gray-500 mt-1">Cada troca registrada usa esse valor.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4">Observações</h2>
          <textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} placeholder="Pontos de atenção sobre a entrega..." rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
        </div>

        {erro && (<div className="p-3 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}><AlertCircle className="w-4 h-4" /> {erro}</div>)}

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate('/cacambas')} className="px-6 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>) : 'Criar locação'}
          </button>
        </div>
      </form>
    </div>
  )
}
