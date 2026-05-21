import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { ArrowLeft, Package, Wrench, MapPin, Calendar, FileText, AlertCircle, Loader2 } from 'lucide-react'

const tipoLabel: Record<string, string> = {
  CONTAINER_SECO: 'Container Seco',
  CONTAINER_REEFER: 'Container Reefer',
  CACAMBA_ESTACIONARIA: 'Caçamba Estacionária',
  CAMINHAO_MUNCK: 'Caminhão Munck',
}

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  DISPONIVEL: { bg: '#EAF3DE', text: '#27500A', label: 'Disponível' },
  LOCADO: { bg: '#E3EEFA', text: '#1A5276', label: 'Locado' },
  MANUTENCAO: { bg: '#FEF3E2', text: '#633806', label: 'Manutenção' },
  INATIVO: { bg: '#F1EFE8', text: '#888', label: 'Inativo' },
}

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

export default function EquipamentoDetalhe() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [equip, setEquip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [savingStatus, setSavingStatus] = useState(false)
  const [showManut, setShowManut] = useState(false)
  const [erroManut, setErroManut] = useState('')
  const [salvandoManut, setSalvandoManut] = useState(false)
  const [manut, setManut] = useState({
    tipo: 'PREVENTIVA',
    dtManutencao: new Date().toISOString().slice(0, 10),
    descricao: '',
    custo: '',
    proxManutHs: '',
  })

  const load = () => {
    if (!id) return
    setLoading(true)
    api.get(`/equipamentos/${id}`).then((r) => setEquip(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [id])

  const atualizarStatus = async (novoStatus: string) => {
    setSavingStatus(true)
    try {
      await api.put(`/equipamentos/${id}/status`, { status: novoStatus, localizacao: equip.localizacao })
      load()
    } finally {
      setSavingStatus(false)
    }
  }

  const submitManut = async (e: FormEvent) => {
    e.preventDefault()
    setErroManut('')
    if (!manut.descricao) return setErroManut('Descreva a manutenção.')
    setSalvandoManut(true)
    try {
      await api.post(`/equipamentos/${id}/manutencao`, {
        ...manut,
        custo: manut.custo ? Number(manut.custo) : null,
        proxManutHs: manut.proxManutHs ? Number(manut.proxManutHs) : null,
      })
      setShowManut(false)
      setManut({ tipo: 'PREVENTIVA', dtManutencao: new Date().toISOString().slice(0, 10), descricao: '', custo: '', proxManutHs: '' })
      load()
    } catch (err: any) {
      setErroManut(err.response?.data?.message || 'Erro ao registrar manutenção.')
    } finally {
      setSalvandoManut(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!equip) return <div className="p-8 text-gray-400">Equipamento não encontrado.</div>

  const status = statusColor[equip.status] || statusColor.DISPONIVEL
  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <div className="p-8 max-w-4xl animate-fade-in">
      <button
        onClick={() => navigate('/equipamentos')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para equipamentos
      </button>

      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3E2' }}>
            <Package className="w-7 h-7" style={{ color: '#FFAF06' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-gray-900">{equip.codigo}</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: status.bg, color: status.text }}>
                {status.label}
              </span>
            </div>
            <p className="text-gray-700">{equip.modelo} — {tipoLabel[equip.tipo] || equip.tipo}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 flex-wrap">
              <span>{equip.capacidade}</span>
              <span>Ano {equip.ano}</span>
              {equip.localizacao && (<span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {equip.localizacao}</span>)}
              {equip.horimetro != null && <span>{equip.horimetro}h</span>}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t flex gap-2 flex-wrap" style={{ borderColor: '#F1EFE8' }}>
          <span className="text-xs text-gray-500 mr-2 self-center">Mudar status:</span>
          {['DISPONIVEL', 'LOCADO', 'MANUTENCAO', 'INATIVO'].map((s) => (
            <button
              key={s}
              onClick={() => atualizarStatus(s)}
              disabled={savingStatus || equip.status === s}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              style={{
                background: equip.status === s ? '#FFAF06' : '#F5F0EB',
                color: equip.status === s ? '#1A1C1E' : '#888',
              }}
            >
              {statusColor[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Wrench className="w-4 h-4" /> Manutenções</h2>
          <button
            onClick={() => setShowManut(!showManut)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: '#FFF8E6', color: '#FFAF06' }}
          >
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
              placeholder="Descreva a manutenção realizada..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
              style={inputStyle}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                value={manut.custo}
                onChange={(e) => setManut({ ...manut, custo: e.target.value })}
                placeholder="Custo R$"
                className={inputCls}
                style={inputStyle}
              />
              <input
                type="number"
                min="0"
                value={manut.proxManutHs}
                onChange={(e) => setManut({ ...manut, proxManutHs: e.target.value })}
                placeholder="Próx. em (horas)"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            {erroManut && (
              <div className="text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> {erroManut}
              </div>
            )}
            <button
              type="submit"
              disabled={salvandoManut}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2"
              style={{ background: salvandoManut ? '#CC8C00' : '#FFAF06' }}
            >
              {salvandoManut && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Salvar manutenção
            </button>
          </form>
        )}

        {equip.manutencoes?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma manutenção registrada.</p>
        ) : (
          <div className="space-y-2">
            {equip.manutencoes.map((m: any) => (
              <div key={m.id} className="p-3 rounded-lg flex items-start gap-3" style={{ background: '#F9F7F4' }}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: m.tipo === 'CORRETIVA' ? '#E74C3C' : '#FFAF06' }} />
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

      {equip.contratosEquip?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Contratos vinculados</h2>
          <div className="space-y-2">
            {equip.contratosEquip.map((ce: any) => (
              <div
                key={ce.id}
                onClick={() => navigate(`/contratos/${ce.contrato.id}`)}
                className="p-3 rounded-lg cursor-pointer hover:bg-gray-50"
                style={{ background: '#F9F7F4' }}
              >
                <div className="text-sm font-semibold text-gray-900">{ce.contrato.numero}</div>
                <div className="text-xs text-gray-500">{ce.contrato.cliente?.razaoSocial}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {equip.observacoes && (
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Observações</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{equip.observacoes}</p>
        </div>
      )}
    </div>
  )
}
