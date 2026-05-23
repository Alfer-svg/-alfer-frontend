import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Truck, Package, Loader2, AlertCircle, X, MapPin, Calendar, User, ImagePlus, Camera, AlertTriangle, CheckCircle2, ArrowRight, FileText } from 'lucide-react'
import { comprimirImagem } from '../utils/imagem'
import { Modal } from '../components/Modal'

const statusInfo: Record<string, { bg: string; text: string; label: string }> = {
  PARA_MOBILIZAR:     { bg: '#FEF3E2', text: '#633806', label: 'Para mobilizar' },
  MOBILIZADO:         { bg: '#EAF3DE', text: '#27500A', label: 'Mobilizado' },
  PARA_DESMOBILIZAR:  { bg: '#FDEEEE', text: '#8B0000', label: 'Para desmobilizar' },
  DESMOBILIZADO:      { bg: '#F1EFE8', text: '#888',    label: 'Desmobilizado' },
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

export default function Logistica() {
  const navigate = useNavigate()
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('PARA_MOBILIZAR')
  const [mobModal, setMobModal] = useState<any>(null)
  const [desmobModal, setDesmobModal] = useState<any>(null)
  const [erroAcao, setErroAcao] = useState('')

  const load = () => {
    setLoading(true)
    const params: any = {}
    if (filtroStatus) params.status = filtroStatus
    api.get('/logistica', { params })
      .then((r) => setItens(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroStatus])

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Logística</h1>
          <p className="text-gray-500 text-sm mt-1">Mobilização e desmobilização de containers — fotos e avarias</p>
        </div>
      </div>

      {/* Tabs por status */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(statusInfo).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setFiltroStatus(key)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: filtroStatus === key ? info.text : info.bg,
              color: filtroStatus === key ? 'white' : info.text,
            }}
          >
            {info.label}
          </button>
        ))}
        <button
          onClick={() => setFiltroStatus('')}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: filtroStatus === '' ? '#1A1C1E' : '#F1EFE8', color: filtroStatus === '' ? 'white' : '#888' }}
        >
          Todos
        </button>
      </div>

      {erroAcao && (
        <div className="p-3 mb-4 rounded-xl text-red-700 text-sm flex items-center gap-2" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {erroAcao}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : itens.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum item nessa categoria</p>
          <p className="text-xs mt-1">Itens de logística são criados automaticamente quando você ativa um contrato com equipamentos vinculados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
          {itens.map((it) => {
            const s = statusInfo[it.status] || statusInfo.PARA_MOBILIZAR
            const contato = it.contrato?.cliente?.contatos?.[0]
            const fotos = [...(it.fotosMobilizacao || []), ...(it.fotosDesmobilizacao || [])]
            return (
              <div key={it.id} className="bg-white rounded-2xl p-5 animate-fade-in" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start gap-3 mb-3">
                  {it.equipamento?.fotoUrl ? (
                    <img src={it.equipamento.fotoUrl} alt={it.equipamento.codigo} className="w-12 h-12 rounded-xl object-cover" style={{ background: '#FEF3E2' }} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FEF3E2' }}>
                      <Package className="w-6 h-6" style={{ color: '#FFAF06' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{it.equipamento?.codigo}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.text }}>
                        {s.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{it.equipamento?.modelo} • {it.equipamento?.capacidade}</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <button onClick={() => navigate(`/contratos/${it.contrato?.id}`)} className="hover:underline">
                      {it.contrato?.numero} — {it.contrato?.cliente?.razaoSocial}
                    </button>
                  </div>
                  {contato?.telefone && (
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-gray-400" /> {contato.nome} • {contato.telefone}
                    </div>
                  )}
                  {it.enderecoEntrega && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" /> {it.enderecoEntrega}
                    </div>
                  )}
                  {it.dtMobilizacao && (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-3 h-3" /> Mobilizado em {fmtDate(it.dtMobilizacao)}
                      {it.responsavelMobilizacao && ` por ${it.responsavelMobilizacao}`}
                    </div>
                  )}
                  {it.dtDesmobilizacao && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="w-3 h-3" /> Desmobilizado em {fmtDate(it.dtDesmobilizacao)}
                      {it.responsavelDesmobilizacao && ` por ${it.responsavelDesmobilizacao}`}
                    </div>
                  )}
                  {it.avariasIdentificadas && (
                    <div className="flex items-start gap-2 text-red-700 p-2 rounded-lg" style={{ background: '#FDEEEE' }}>
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Avarias: {it.avariasIdentificadas}</div>
                        {it.valorAvarias && <div className="text-xs mt-0.5">Cobrança: {fmt(Number(it.valorAvarias))}</div>}
                      </div>
                    </div>
                  )}
                </div>

                {fotos.length > 0 && (
                  <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
                    {fotos.slice(0, 6).map((f: string, i: number) => (
                      <img
                        key={i}
                        src={f}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80"
                        onClick={() => window.open(f, '_blank')}
                      />
                    ))}
                    {fotos.length > 6 && (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xs text-gray-500" style={{ background: '#F1EFE8' }}>
                        +{fotos.length - 6}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t" style={{ borderColor: '#F1EFE8' }}>
                  {it.status === 'PARA_MOBILIZAR' && (
                    <button onClick={() => setMobModal(it)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-900" style={{ background: '#FFAF06' }}>
                      <ArrowRight className="w-4 h-4" /> Mobilizar
                    </button>
                  )}
                  {(it.status === 'PARA_DESMOBILIZAR' || it.status === 'MOBILIZADO') && (
                    <button onClick={() => setDesmobModal(it)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#8B0000' }}>
                      <ArrowRight className="w-4 h-4" /> Desmobilizar
                    </button>
                  )}
                  {it.status === 'DESMOBILIZADO' && (
                    <div className="text-xs text-gray-400 text-center w-full py-2">✓ Operação concluída</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {mobModal && (
        <MobilizarModal item={mobModal} onClose={() => setMobModal(null)} onSuccess={() => { setMobModal(null); load() }} onErro={setErroAcao} />
      )}
      {desmobModal && (
        <DesmobilizarModal item={desmobModal} onClose={() => setDesmobModal(null)} onSuccess={() => { setDesmobModal(null); load() }} onErro={setErroAcao} />
      )}
    </div>
  )
}

function FotosUpload({ fotos, onChange, max = 10 }: { fotos: string[]; onChange: (f: string[]) => void; max?: number }) {
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    if (fotos.length + files.length > max) {
      setErro(`Máximo de ${max} fotos.`)
      return
    }
    setErro('')
    setProcessando(true)
    try {
      const novas: string[] = []
      for (const file of Array.from(files)) {
        const dataUrl = await comprimirImagem(file)
        novas.push(dataUrl)
      }
      onChange([...fotos, ...novas])
    } catch (err: any) {
      setErro(err.message || 'Erro ao processar fotos.')
    } finally {
      setProcessando(false)
    }
  }

  const removerFoto = (i: number) => onChange(fotos.filter((_, idx) => idx !== i))

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {fotos.map((f, i) => (
          <div key={i} className="relative">
            <img src={f} alt="" className="w-full h-20 rounded-lg object-cover" style={{ border: '1px solid #E0DDD8' }} />
            <button type="button" onClick={() => removerFoto(i)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center text-red-600" style={{ border: '1px solid #FACACA' }}>
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {fotos.length < max && (
          <label className="flex flex-col items-center justify-center gap-1 cursor-pointer rounded-lg h-20 text-gray-500 hover:bg-gray-50" style={{ border: '2px dashed #E0DDD8' }}>
            {processando ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#FFAF06' }} />
            ) : (
              <>
                <Camera className="w-5 h-5" style={{ color: '#FFAF06' }} />
                <span className="text-xs">{fotos.length === 0 ? 'Adicionar' : '+'}</span>
              </>
            )}
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" disabled={processando} onChange={(e) => handleFiles(e.target.files)} />
          </label>
        )}
      </div>
      {erro && <div className="text-xs text-red-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {erro}</div>}
      <p className="text-xs text-gray-400">{fotos.length}/{max} fotos. JPG/PNG comprimidas automaticamente.</p>
    </div>
  )
}

function MobilizarModal({ item, onClose, onSuccess, onErro }: { item: any; onClose: () => void; onSuccess: () => void; onErro: (m: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    enderecoEntrega: item.enderecoEntrega || '',
    responsavel: '',
    observacoes: '',
  })
  const [fotos, setFotos] = useState<string[]>([])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (fotos.length === 0) {
      onErro('Tire ao menos uma foto antes de mobilizar.')
      return
    }
    setLoading(true)
    try {
      await api.post(`/logistica/${item.id}/mobilizar`, { ...form, fotos })
      onSuccess()
    } catch (err: any) {
      onErro(err.response?.data?.message || 'Erro ao mobilizar.')
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">Mobilizar — {item.equipamento?.codigo}</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <p className="text-xs text-gray-500 mb-4">Contrato {item.contrato?.numero} • {item.contrato?.cliente?.razaoSocial}</p>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Endereço de entrega</label>
          <input value={form.enderecoEntrega} onChange={(e) => setForm({ ...form, enderecoEntrega: e.target.value })} placeholder="Rua, número, bairro, cidade" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Responsável (motorista/equipe)</label>
          <input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do responsável pela entrega" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Observações do checklist *</label>
          <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} placeholder="Ex: Container em perfeito estado. Lacre 12345. Cliente recebeu chave..." className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-2">Fotos do equipamento na entrega *</label>
          <FotosUpload fotos={fotos} onChange={setFotos} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirmar mobilização
          </button>
        </div>
      </form>
    </Modal>
  )
}

function DesmobilizarModal({ item, onClose, onSuccess, onErro }: { item: any; onClose: () => void; onSuccess: () => void; onErro: (m: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    responsavel: '',
    observacoes: '',
    avariasIdentificadas: '',
    valorAvarias: '',
  })
  const [fotos, setFotos] = useState<string[]>([])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (fotos.length === 0) {
      onErro('Tire ao menos uma foto antes de desmobilizar.')
      return
    }
    if (form.valorAvarias && !form.avariasIdentificadas) {
      onErro('Descreva as avarias antes de informar o valor de cobrança.')
      return
    }
    setLoading(true)
    try {
      await api.post(`/logistica/${item.id}/desmobilizar`, { ...form, fotos })
      onSuccess()
    } catch (err: any) {
      onErro(err.response?.data?.message || 'Erro ao desmobilizar.')
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">Desmobilizar — {item.equipamento?.codigo}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Contrato {item.contrato?.numero}. Compare com as fotos da mobilização pra identificar avarias.</p>

        {/* Fotos da mobilização pra referência */}
        {item.fotosMobilizacao?.length > 0 && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: '#F9F7F4', border: '1px solid #E0DDD8' }}>
            <div className="text-xs font-medium text-gray-700 mb-2">📷 Fotos da mobilização (referência):</div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {item.fotosMobilizacao.map((f: string, i: number) => (
                <img key={i} src={f} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80" onClick={() => window.open(f, '_blank')} />
              ))}
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Responsável pela retirada</label>
            <input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do responsável" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Observações gerais</label>
            <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} placeholder="Ex: Cliente liberou retirada às 10h. Lacre intacto." className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">Fotos do equipamento na retirada *</label>
            <FotosUpload fotos={fotos} onChange={setFotos} />
          </div>
          <div className="p-3 rounded-xl space-y-3" style={{ background: '#FDEEEE', border: '1px solid #FACACA' }}>
            <div className="text-xs font-medium text-red-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Avarias identificadas (opcional)</div>
            <div>
              <textarea value={form.avariasIdentificadas} onChange={(e) => setForm({ ...form, avariasIdentificadas: e.target.value })} rows={2} placeholder="Ex: Amassado na porta lateral, pintura riscada em 2 pontos..." className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-white resize-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valor de cobrança (R$)</label>
              <input value={form.valorAvarias} onChange={(e) => setForm({ ...form, valorAvarias: e.target.value })} type="number" step="0.01" min="0" placeholder="0,00 (gera um lançamento no financeiro)" className={inputCls} style={inputStyle} />
              <p className="text-xs text-gray-500 mt-1">Se informar valor, será criada uma fatura pendente no financeiro vinculada ao contrato.</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: loading ? '#5C0000' : '#8B0000' }}>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar desmobilização
            </button>
          </div>
        </form>
    </Modal>
  )
}
