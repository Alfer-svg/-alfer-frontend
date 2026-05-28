import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Truck, Package, Loader2, AlertCircle, X, MapPin, Calendar, User, ImagePlus, Camera, AlertTriangle, CheckCircle2, ArrowRight, FileText, Pencil } from 'lucide-react'
import { comprimirImagem } from '../utils/imagem'
import { Modal } from '../components/Modal'
import { fmtDate } from '../utils/data'

const statusInfo: Record<string, { bg: string; text: string; label: string }> = {
  PARA_MOBILIZAR:     { bg: '#FEF3E2', text: '#633806', label: 'Para mobilizar' },
  MOBILIZADO:         { bg: '#EAF3DE', text: '#27500A', label: 'Mobilizado' },
  PARA_DESMOBILIZAR:  { bg: '#FDEEEE', text: '#8B0000', label: 'Para desmobilizar' },
  DESMOBILIZADO:      { bg: '#F1EFE8', text: '#888',    label: 'Desmobilizado' },
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function statusData(dt?: string | null): { bg: string; text: string; label: string; days: number | null } {
  if (!dt) return { bg: '#F1EFE8', text: '#888', label: 'Sem data programada', days: null }
  const dias = Math.ceil((new Date(dt).getTime() - Date.now()) / 86400000)
  if (dias < 0) return { bg: '#FDEEEE', text: '#8B0000', label: `Atrasado há ${Math.abs(dias)} dia(s)`, days: dias }
  if (dias === 0) return { bg: '#FDEEEE', text: '#8B0000', label: 'Programado pra HOJE', days: 0 }
  if (dias <= 3) return { bg: '#FEF3E2', text: '#633806', label: `Em ${dias} dia(s)`, days: dias }
  return { bg: '#EAF3DE', text: '#27500A', label: `Em ${dias} dia(s)`, days: dias }
}

export default function Logistica() {
  const navigate = useNavigate()
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('PARA_MOBILIZAR')
  const [mobModal, setMobModal] = useState<any>(null)
  const [desmobModal, setDesmobModal] = useState<any>(null)
  const [editarDataModal, setEditarDataModal] = useState<any>(null)
  const [atribuirModal, setAtribuirModal] = useState<{ item: any; tipo: 'MOB' | 'DESMOB' } | null>(null)
  const [erroAcao, setErroAcao] = useState('')
  const [contagens, setContagens] = useState<Record<string, number>>({})

  const load = () => {
    setLoading(true)
    const params: any = {}
    if (filtroStatus) params.status = filtroStatus
    Promise.all([
      api.get('/logistica', { params }),
      api.get('/logistica/resumo'),
    ])
      .then(([list, res]) => {
        setItens(list.data)
        // resumo vem como [{status, _count: {_all: N}}, ...] → vira { STATUS: N }
        const map: Record<string, number> = {}
        for (const r of res.data || []) {
          map[r.status] = r._count?._all ?? 0
        }
        setContagens(map)
      })
      .finally(() => setLoading(false))
  }
  useEffect(load, [filtroStatus])

  const totalGeral = Object.values(contagens).reduce((a, b) => a + b, 0)

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
        {Object.entries(statusInfo).map(([key, info]) => {
          const n = contagens[key] || 0
          const ativo = filtroStatus === key
          return (
            <button
              key={key}
              onClick={() => setFiltroStatus(key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: ativo ? info.text : info.bg,
                color: ativo ? 'white' : info.text,
              }}
            >
              {info.label}
              <span
                className="px-1.5 py-0.5 rounded-md text-[11px] font-semibold"
                style={{
                  background: ativo ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                  color: ativo ? 'white' : info.text,
                  minWidth: 22,
                  textAlign: 'center',
                }}
              >
                {n}
              </span>
            </button>
          )
        })}
        <button
          onClick={() => setFiltroStatus('')}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          style={{ background: filtroStatus === '' ? '#1A1C1E' : '#F1EFE8', color: filtroStatus === '' ? 'white' : '#888' }}
        >
          Todos
          <span
            className="px-1.5 py-0.5 rounded-md text-[11px] font-semibold"
            style={{
              background: filtroStatus === '' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
              minWidth: 22,
              textAlign: 'center',
            }}
          >
            {totalGeral}
          </span>
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
      ) : filtroStatus === '' ? (
        // ─── VIEW DE LISTA COMPACTA (filtro "Todos") ───
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {itens.map((it, idx) => {
            const s = statusInfo[it.status] || statusInfo.PARA_MOBILIZAR
            const dt = it.status === 'PARA_MOBILIZAR' ? it.dtPrevistaMobilizacao
                     : it.status === 'PARA_DESMOBILIZAR' ? it.dtPrevistaDesmobilizacao
                     : it.dtMobilizacao || it.dtDesmobilizacao
            const stData = it.status === 'PARA_MOBILIZAR' || it.status === 'PARA_DESMOBILIZAR' ? statusData(dt) : null
            return (
              <div
                key={it.id}
                onClick={() => navigate(`/contratos/${it.contrato?.id}`)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-all"
                style={{ borderTop: idx > 0 ? '1px solid #F1EFE8' : 'none' }}
              >
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0"
                  style={{ background: s.bg, color: s.text, minWidth: 110, textAlign: 'center' }}
                >
                  {s.label}
                </span>
                <span className="font-semibold text-gray-900 text-sm w-20 flex-shrink-0">{it.equipamento?.codigo}</span>
                <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">
                  {it.contrato?.numero} — {it.contrato?.cliente?.razaoSocial}
                </span>
                {dt && (
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: stData?.text || '#888' }}
                  >
                    📅 {fmtDate(dt)}
                  </span>
                )}
                {it.avariasIdentificadas && (
                  <span title={`Avarias: ${it.avariasIdentificadas}`} className="flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </span>
                )}
                {it.status === 'PARA_MOBILIZAR' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAtribuirModal({ item: it, tipo: 'MOB' }) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-900 flex-shrink-0"
                    style={{ background: '#FFAF06' }}
                  >
                    {it.operacaoMobilizacaoId ? 'Atribuída' : 'Atribuir'}
                  </button>
                )}
                {(it.status === 'PARA_DESMOBILIZAR' || it.status === 'MOBILIZADO') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAtribuirModal({ item: it, tipo: 'DESMOB' }) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex-shrink-0"
                    style={{ background: '#8B0000' }}
                  >
                    {it.operacaoDesmobilizacaoId ? 'Atribuída' : 'Atribuir'}
                  </button>
                )}
              </div>
            )
          })}
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

                {/* Badge de data prevista — só mostra em PARA_MOBILIZAR e PARA_DESMOBILIZAR */}
                {(it.status === 'PARA_MOBILIZAR' || it.status === 'PARA_DESMOBILIZAR') && (() => {
                  const dt = it.status === 'PARA_MOBILIZAR' ? it.dtPrevistaMobilizacao : it.dtPrevistaDesmobilizacao
                  const st = statusData(dt)
                  const acao = it.status === 'PARA_MOBILIZAR' ? 'Mobilizar' : 'Desmobilizar'
                  return (
                    <div className="mb-3 p-2.5 rounded-xl flex items-center justify-between gap-2" style={{ background: st.bg, border: `1px solid ${st.text}33` }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: st.text }} />
                        <div className="text-xs min-w-0">
                          <div className="font-semibold" style={{ color: st.text }}>{acao}: {st.label}</div>
                          {dt && <div className="text-gray-600 truncate">📅 {fmtDate(dt)}</div>}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditarDataModal(it)}
                        title="Editar data programada"
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white"
                        style={{ color: st.text }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })()}

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

                <div className="flex flex-col gap-2 pt-3 border-t" style={{ borderColor: '#F1EFE8' }}>
                  {it.status === 'PARA_MOBILIZAR' && (
                    <>
                      <button
                        onClick={() => setAtribuirModal({ item: it, tipo: 'MOB' })}
                        disabled={!!it.operacaoMobilizacaoId}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-900 disabled:opacity-60"
                        style={{ background: '#FFAF06' }}
                      >
                        <ArrowRight className="w-4 h-4" />
                        {it.operacaoMobilizacaoId ? 'Atribuída ao motorista' : 'Atribuir a motorista'}
                      </button>
                      <button
                        onClick={() => setMobModal(it)}
                        className="text-xs text-gray-500 hover:text-gray-900 underline"
                      >
                        ou executar agora (sem app)
                      </button>
                    </>
                  )}
                  {(it.status === 'PARA_DESMOBILIZAR' || it.status === 'MOBILIZADO') && (
                    <>
                      <button
                        onClick={() => setAtribuirModal({ item: it, tipo: 'DESMOB' })}
                        disabled={!!it.operacaoDesmobilizacaoId}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                        style={{ background: '#8B0000' }}
                      >
                        <ArrowRight className="w-4 h-4" />
                        {it.operacaoDesmobilizacaoId ? 'Atribuída ao motorista' : 'Atribuir a motorista'}
                      </button>
                      <button
                        onClick={() => setDesmobModal(it)}
                        className="text-xs text-gray-500 hover:text-gray-900 underline"
                      >
                        ou executar agora (sem app)
                      </button>
                    </>
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
      {atribuirModal && (
        <AtribuirModal
          item={atribuirModal.item}
          tipo={atribuirModal.tipo}
          onClose={() => setAtribuirModal(null)}
          onSuccess={() => { setAtribuirModal(null); load() }}
          onErro={setErroAcao}
        />
      )}
      {editarDataModal && (
        <EditarDataModal item={editarDataModal} onClose={() => setEditarDataModal(null)} onSuccess={() => { setEditarDataModal(null); load() }} onErro={setErroAcao} />
      )}
    </div>
  )
}

function EditarDataModal({ item, onClose, onSuccess, onErro }: { item: any; onClose: () => void; onSuccess: () => void; onErro: (m: string) => void }) {
  const isMob = item.status === 'PARA_MOBILIZAR'
  const campo = isMob ? 'dtPrevistaMobilizacao' : 'dtPrevistaDesmobilizacao'
  const dataAtual = isMob ? item.dtPrevistaMobilizacao : item.dtPrevistaDesmobilizacao
  const [data, setData] = useState(dataAtual ? new Date(dataAtual).toISOString().slice(0, 10) : '')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put(`/logistica/${item.id}`, { [campo]: data || null })
      onSuccess()
    } catch (err: any) {
      onErro(err.response?.data?.message || 'Erro ao salvar data')
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">
          Programar {isMob ? 'mobilização' : 'desmobilização'}
        </h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        {item.equipamento?.codigo} — Contrato {item.contrato?.numero}
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Data programada</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white"
            style={{ border: '1px solid #E0DDD8' }}
          />
          <p className="text-xs text-gray-400 mt-1">Deixe em branco pra remover a programação.</p>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Salvar
          </button>
        </div>
      </form>
    </Modal>
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

function AtribuirModal({
  item, tipo, onClose, onSuccess, onErro,
}: {
  item: any
  tipo: 'MOB' | 'DESMOB'
  onClose: () => void
  onSuccess: () => void
  onErro: (m: string) => void
}) {
  const isMob = tipo === 'MOB'
  const acaoLabel = isMob ? 'Mobilização' : 'Desmobilização'
  const dataInicial = isMob
    ? item.dtPrevistaMobilizacao
    : item.dtPrevistaDesmobilizacao

  const [motoristas, setMotoristas] = useState<any[]>([])
  const [caminhoes, setCaminhoes] = useState<any[]>([])
  const [form, setForm] = useState({
    motoristaId: '',
    caminhaoId: '',
    dtAgendada: dataInicial ? new Date(dataInicial).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    horaAgendada: '08:00',
    observacoes: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/motoristas', { params: { ativo: 'true' } }),
      api.get('/caminhoes'),
    ]).then(([m, c]) => {
      setMotoristas(m.data || [])
      setCaminhoes(c.data || [])
    })
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.motoristaId) return onErro('Selecione o motorista.')
    if (!form.dtAgendada) return onErro('Informe a data.')
    setLoading(true)
    try {
      const url = isMob
        ? `/logistica/${item.id}/atribuir-mobilizacao`
        : `/logistica/${item.id}/atribuir-desmobilizacao`
      await api.post(url, {
        motoristaId: form.motoristaId,
        caminhaoId: form.caminhaoId || null,
        dtAgendada: form.dtAgendada,
        horaAgendada: form.horaAgendada || null,
        observacoes: form.observacoes || null,
      })
      onSuccess()
    } catch (err: any) {
      onErro(err.response?.data?.message || `Erro ao atribuir ${acaoLabel.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white'
  const inputStyle = { border: '1px solid #E0DDD8' }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">
          Atribuir {acaoLabel.toLowerCase()}
        </h2>
        <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <div className="text-xs text-gray-500 mb-4 space-y-0.5">
        <div>{item.equipamento?.codigo} • Contrato {item.contrato?.numero}</div>
        <div>{item.contrato?.cliente?.razaoSocial}</div>
        {item.enderecoEntrega && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.enderecoEntrega}</div>}
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Motorista *</label>
          <select
            value={form.motoristaId}
            onChange={(e) => setForm({ ...form, motoristaId: e.target.value })}
            className={inputCls}
            style={inputStyle}
            required
          >
            <option value="">Selecione…</option>
            {motoristas.map((m: any) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Caminhão (opcional)</label>
          <select
            value={form.caminhaoId}
            onChange={(e) => setForm({ ...form, caminhaoId: e.target.value })}
            className={inputCls}
            style={inputStyle}
          >
            <option value="">Sem caminhão definido</option>
            {caminhoes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.codigo} · {c.modelo}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data *</label>
            <input
              type="date"
              value={form.dtAgendada}
              onChange={(e) => setForm({ ...form, dtAgendada: e.target.value })}
              className={inputCls}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hora</label>
            <input
              type="time"
              value={form.horaAgendada}
              onChange={(e) => setForm({ ...form, horaAgendada: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Observações (opcional)</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            rows={2}
            placeholder="Instruções específicas pro motorista"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white resize-none"
            style={inputStyle}
          />
        </div>
        <div className="text-xs text-gray-500 p-3 rounded-lg" style={{ background: '#F1F8E9', border: '1px solid #C8E6C9' }}>
          O motorista vai ver essa {acaoLabel.toLowerCase()} no app dele
          (com endereço, cliente e equipamento já preenchidos). Quando ele
          concluir, o item da logística é atualizado automaticamente com
          as fotos e o responsável.
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white" style={{ border: '1px solid #E0DDD8' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex items-center justify-center gap-2" style={{ background: loading ? '#CC8C00' : '#FFAF06' }}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Atribuir
          </button>
        </div>
      </form>
    </Modal>
  )
}
