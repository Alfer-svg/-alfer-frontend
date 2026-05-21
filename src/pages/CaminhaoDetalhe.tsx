import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Truck, Gauge, Wrench, User, AlertCircle, Loader2 } from 'lucide-react'

const tipoLabel: Record<string, string> = {
  MUNCK: 'Munck',
  POLIGUINDASTE: 'Poliguindaste',
  CAVALO_MECANICO: 'Cavalo Mecânico',
}

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

export default function CaminhaoDetalhe() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [c, setC] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [novoKm, setNovoKm] = useState('')
  const [salvandoKm, setSalvandoKm] = useState(false)
  const [showManut, setShowManut] = useState(false)
  const [erroManut, setErroManut] = useState('')
  const [salvandoManut, setSalvandoManut] = useState(false)
  const [manut, setManut] = useState({
    tipo: 'PREVENTIVA',
    dtManutencao: new Date().toISOString().slice(0, 10),
    descricao: '',
    custo: '',
    proxManutKm: '',
  })

  const load = () => {
    if (!id) return
    setLoading(true)
    api.get(`/caminhoes/${id}`).then((r) => { setC(r.data); setNovoKm(String(r.data.kmAtual || 0)) }).finally(() => setLoading(false))
  }
  useEffect(load, [id])

  const atualizarKm = async () => {
    setSalvandoKm(true)
    try {
      await api.put(`/caminhoes/${id}/km`, { kmAtual: Number(novoKm) })
      load()
    } finally {
      setSalvandoKm(false)
    }
  }

  const submitManut = async (e: FormEvent) => {
    e.preventDefault()
    setErroManut('')
    if (!manut.descricao) return setErroManut('Descreva a manutenção.')
    setSalvandoManut(true)
    try {
      await api.post(`/caminhoes/${id}/manutencao`, {
        ...manut,
        custo: manut.custo ? Number(manut.custo) : null,
        proxManutKm: manut.proxManutKm ? Number(manut.proxManutKm) : null,
      })
      setShowManut(false)
      setManut({ tipo: 'PREVENTIVA', dtManutencao: new Date().toISOString().slice(0, 10), descricao: '', custo: '', proxManutKm: '' })
      load()
    } catch (err: any) {
      setErroManut(err.response?.data?.message || 'Erro ao registrar manutenção.')
    } finally {
      setSalvandoManut(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!c) return <div className="p-8 text-gray-400">Caminhão não encontrado.</div>

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }
  const motorista = c.motoristasAlocados?.find((m: any) => m.ativo)?.motorista
  const kmFaltam = c.proxManutKm ? c.proxManutKm - (c.kmAtual || 0) : null

  return (
    <div className="p-8 max-w-4xl animate-fade-in">
      <button onClick={() => navigate('/caminhoes')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all">
        <ArrowLeft className="w-4 h-4" /> Voltar para caminhões
      </button>

      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
            <Truck className="w-7 h-7" style={{ color: '#FFAF06' }} />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">{c.codigo} — {c.placa}</h1>
            <p className="text-gray-700">{c.modelo} • {tipoLabel[c.tipo] || c.tipo} • {c.capacidade}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 flex-wrap">
              <span>Ano {c.ano}</span>
              {motorista && (<span className="flex items-center gap-1"><User className="w-3 h-3" /> {motorista.nome}</span>)}
              {kmFaltam !== null && (
                <span className={kmFaltam < 1000 ? 'text-orange-600 font-medium' : ''}>
                  Próx. manut: {kmFaltam.toLocaleString('pt-BR')} km
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Gauge className="w-4 h-4" /> Quilometragem</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">KM atual</label>
            <input value={novoKm} onChange={(e) => setNovoKm(e.target.value)} type="number" min="0" className={inputCls} style={inputStyle} />
          </div>
          <button
            onClick={atualizarKm}
            disabled={salvandoKm || Number(novoKm) === c.kmAtual}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-900 disabled:opacity-50"
            style={{ background: '#FFAF06' }}
          >
            {salvandoKm ? 'Salvando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Wrench className="w-4 h-4" /> Manutenções</h2>
          <button onClick={() => setShowManut(!showManut)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#FFF8E6', color: '#FFAF06' }}>
            {showManut ? 'Cancelar' : '+ Registrar manutenção'}
          </button>
        </div>

        {showManut && (
          <form onSubmit={submitManut} className="p-4 rounded-xl mb-4 space-y-3" style={{ background: '#F9F7F4', border: '1px solid #E0DDD8' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={manut.tipo} onChange={(e) => setManut({ ...manut, tipo: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="PREVENTIVA">Preventiva</option>
                <option value="CORRETIVA">Corretiva</option>
                <option value="INSPECAO">Inspeção</option>
              </select>
              <input type="date" value={manut.dtManutencao} onChange={(e) => setManut({ ...manut, dtManutencao: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
            <textarea
              value={manut.descricao}
              onChange={(e) => setManut({ ...manut, descricao: e.target.value })}
              placeholder="Descreva a manutenção..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
              style={inputStyle}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="number" step="0.01" min="0" value={manut.custo} onChange={(e) => setManut({ ...manut, custo: e.target.value })} placeholder="Custo R$" className={inputCls} style={inputStyle} />
              <input type="number" min="0" value={manut.proxManutKm} onChange={(e) => setManut({ ...manut, proxManutKm: e.target.value })} placeholder="Próx. manut (km)" className={inputCls} style={inputStyle} />
            </div>
            {erroManut && (<div className="text-xs text-red-700 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {erroManut}</div>)}
            <button type="submit" disabled={salvandoManut} className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: salvandoManut ? '#CC8C00' : '#FFAF06' }}>
              {salvandoManut && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Salvar manutenção
            </button>
          </form>
        )}

        {c.manutencoes?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma manutenção registrada.</p>
        ) : (
          <div className="space-y-2">
            {c.manutencoes.map((m: any) => (
              <div key={m.id} className="p-3 rounded-lg flex items-start gap-3" style={{ background: '#F9F7F4' }}>
                <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: m.tipo === 'CORRETIVA' ? '#E74C3C' : '#FFAF06' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-700">{m.tipo}</span>
                    <span className="text-xs text-gray-400">{fmtDate(m.dtManutencao)}</span>
                    {m.custo && <span className="text-xs text-gray-500">R$ {Number(m.custo).toLocaleString('pt-BR')}</span>}
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{m.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
