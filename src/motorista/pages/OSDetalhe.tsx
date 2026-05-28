import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiMotorista from '../api'
import {
  MapPin, ArrowLeft, AlertCircle, Camera, Loader2, Trash2, Play, Check, Plus, X,
} from 'lucide-react'

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

const TIPO_MOV_POLI: Record<string, string> = {
  ENTREGA_VAZIA: 'Entrega de caçamba vazia',
  COLETA_CHEIA: 'Coleta de caçamba cheia',
  TROCA: 'Troca de caçamba',
  TRANSPORTE_DESTINO: 'Transporte ao destino',
}

const SERVICO_MUNCK_LABEL: Record<string, string> = {
  ICAMENTO: 'Içamento',
  CARGA_DESCARGA: 'Carga e descarga',
  TRANSPORTE: 'Transporte',
  MOVIMENTACAO: 'Movimentação',
  INSTALACAO: 'Instalação',
  OUTROS: 'Outros',
}

async function comprimirImagem(file: File, maxLado = 1280, qualidade = 0.75): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })
  let w = img.width, h = img.height
  if (w > h && w > maxLado) { h = (h * maxLado) / w; w = maxLado }
  else if (h > maxLado) { w = (w * maxLado) / h; h = maxLado }
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', qualidade)
  })
}

const nowHHMM = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const fmtMoney = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ──────────────────────────────────────────────────────────────────────────
// Cabeçalho de seção (replicando o padrão da OS impressa)
// ──────────────────────────────────────────────────────────────────────────

function Secao({ num, titulo, children }: { num: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E0DDD8' }}>
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: '#FFF8E6' }}>
        <div className="w-1 h-5 rounded" style={{ background: '#FFAF06' }} />
        <span className="text-xs font-bold" style={{ color: '#633806' }}>{num}</span>
        <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{titulo}</span>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </section>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 bg-white rounded-lg text-sm outline-none'
const inputStyle: React.CSSProperties = { border: '1px solid #E0DDD8' }

// ──────────────────────────────────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────────────────────────────────

interface MedicaoItem {
  descricao: string
  qtd: string | number
  valorUnit: string | number
  valorTotal: string | number
}

export default function MotoristaOSDetalhe() {
  const { tipo, id } = useParams<{ tipo: 'munck' | 'poli'; id: string }>()
  const navigate = useNavigate()
  const [os, setOs] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvandoFinalizar, setSalvandoFinalizar] = useState(false)
  const lastSaveRef = useRef<string>('')

  // Estado do formulário (campos editáveis pelo motorista)
  const [form, setForm] = useState({
    hChegada: '',
    hInicio: '',
    hTermino: '',
    hSaida: '',
    kmInicial: '',
    kmFinal: '',
    descricaoOperacional: '',
    ocorrencias: '',
    obraSetor: '',
    cargaDescricao: '',
    cargaPesoKg: '',
    cargaQuantidade: '',
    cargaDimensoes: '',
    respNome: '',
  })
  const [medicao, setMedicao] = useState<MedicaoItem[]>([])
  const [fotos, setFotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  // Carrega OS
  useEffect(() => {
    apiMotorista.get('/motorista-app/me/operacoes-hoje')
      .then((r) => {
        const found = (r.data || []).find(
          (x: any) => x.id === id && x.__kind === (tipo === 'munck' ? 'OS_MUNCK' : 'OS_POLI'),
        )
        if (found) {
          setOs(found)
          setForm({
            hChegada: found.hChegada || '',
            hInicio: found.hInicio || '',
            hTermino: found.hTermino || '',
            hSaida: found.hSaida || '',
            kmInicial: found.kmInicial != null ? String(found.kmInicial) : '',
            kmFinal: found.kmFinal != null ? String(found.kmFinal) : '',
            descricaoOperacional: found.descricaoOperacional || '',
            ocorrencias: found.ocorrencias || '',
            obraSetor: found.obraSetor || '',
            cargaDescricao: found.cargaDescricao || '',
            cargaPesoKg: found.cargaPesoKg != null ? String(found.cargaPesoKg) : '',
            cargaQuantidade: found.cargaQuantidade != null ? String(found.cargaQuantidade) : '',
            cargaDimensoes: found.cargaDimensoes || '',
            respNome: found.assinaturaClienteNome ||
              (tipo === 'munck' ? found.responsavelLocal : found.responsavelOrigem) || '',
          })
          setMedicao(Array.isArray(found.medicaoItens) ? found.medicaoItens : [])
          setFotos(found.fotosUrls || [])
        } else {
          setErro('OS não encontrada na sua fila de hoje')
        }
      })
      .finally(() => setLoading(false))
  }, [id, tipo])

  // Autosave debounced
  const isMunck = tipo === 'munck'
  const podeEditar = os && os.status !== 'CONCLUIDA' && os.status !== 'CANCELADA'

  const salvar = async (extra: Record<string, any> = {}) => {
    if (!os || !podeEditar) return
    const payload: any = {
      hChegada: form.hChegada || null,
      hInicio: form.hInicio || null,
      hTermino: form.hTermino || null,
      hSaida: form.hSaida || null,
      kmInicial: form.kmInicial ? parseInt(form.kmInicial, 10) : null,
      kmFinal: form.kmFinal ? parseInt(form.kmFinal, 10) : null,
      descricaoOperacional: form.descricaoOperacional || null,
      ocorrencias: form.ocorrencias || null,
      obraSetor: form.obraSetor || null,
      cargaDescricao: form.cargaDescricao || null,
      cargaPesoKg: form.cargaPesoKg ? parseFloat(form.cargaPesoKg) : null,
      cargaQuantidade: form.cargaQuantidade ? parseInt(form.cargaQuantidade, 10) : null,
      cargaDimensoes: form.cargaDimensoes || null,
      medicaoItens: medicao,
      fotosUrls: fotos,
      ...(isMunck
        ? { responsavelLocal: form.respNome || null, assinaturaClienteNome: form.respNome || null }
        : { responsavelOrigem: form.respNome || null, assinaturaClienteNome: form.respNome || null }),
      ...extra,
    }
    const key = JSON.stringify(payload)
    if (key === lastSaveRef.current) return
    lastSaveRef.current = key
    setSalvando(true)
    try {
      const url = isMunck
        ? `/motorista-app/os/munck/${os.id}/salvar`
        : `/motorista-app/os/poli/${os.id}/concluir` // Poli ainda usa concluir; salvar parcial só pra Munck por enquanto
      // Pra Poli, não fazemos autosave parcial (endpoint não existe). Só salva no concluir.
      if (isMunck) await apiMotorista.post(url, payload)
    } catch {
      // silencioso pra autosave
    } finally {
      setSalvando(false)
    }
  }

  // Autosave a cada 5s se houver mudança (só Munck)
  useEffect(() => {
    if (!isMunck || !podeEditar) return
    const t = setTimeout(() => { salvar() }, 5000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, medicao, fotos, isMunck, podeEditar])

  const iniciar = async () => {
    if (!id) return
    setErro('')
    try {
      await apiMotorista.post(`/motorista-app/os/${tipo}/${id}/iniciar`)
      setOs({ ...os, status: 'EM_ANDAMENTO', hInicio: nowHHMM() })
      setForm((f) => ({ ...f, hInicio: f.hInicio || nowHHMM() }))
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Falha ao iniciar')
    }
  }

  const adicionarFoto = async (file: File) => {
    setUploading(true)
    setErro('')
    try {
      const blob = await comprimirImagem(file)
      const fd = new FormData()
      fd.append('file', blob, `${Date.now()}.jpg`)
      const { data } = await apiMotorista.post('/motorista-app/upload/operacao', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFotos((p) => [...p, data.url])
    } catch (e: any) {
      setErro('Falha ao enviar foto: ' + (e?.response?.data?.message || e.message))
    } finally {
      setUploading(false)
    }
  }

  const finalizar = async () => {
    if (!id) return
    if (fotos.length === 0) {
      setErro('Adicione ao menos uma foto da execução')
      return
    }
    setErro('')
    setSalvandoFinalizar(true)
    try {
      const payloadConcluir = {
        hChegada: form.hChegada || null,
        hInicio: form.hInicio || null,
        hTermino: form.hTermino || nowHHMM(),
        hSaida: form.hSaida || null,
        kmInicial: form.kmInicial ? parseInt(form.kmInicial, 10) : null,
        kmFinal: form.kmFinal ? parseInt(form.kmFinal, 10) : null,
        descricaoOperacional: form.descricaoOperacional || null,
        ocorrencias: form.ocorrencias || null,
        obraSetor: form.obraSetor || null,
        cargaDescricao: form.cargaDescricao || null,
        cargaPesoKg: form.cargaPesoKg ? parseFloat(form.cargaPesoKg) : null,
        cargaQuantidade: form.cargaQuantidade ? parseInt(form.cargaQuantidade, 10) : null,
        cargaDimensoes: form.cargaDimensoes || null,
        medicaoItens: medicao,
        fotosUrls: fotos,
        respNome: form.respNome || null,
        assinaturaClienteNome: form.respNome || null,
      }
      await apiMotorista.post(`/motorista-app/os/${tipo}/${id}/concluir`, payloadConcluir)
      navigate('/m/operacoes')
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Falha ao concluir')
    } finally {
      setSalvandoFinalizar(false)
    }
  }

  // ── Medição helpers
  const calcularTotalLinha = (qtd: any, vu: any) => {
    const q = parseFloat(String(qtd).replace(',', '.')) || 0
    const v = parseFloat(String(vu).replace(',', '.')) || 0
    return Math.round(q * v * 100) / 100
  }
  const atualizarMedicao = (i: number, patch: Partial<MedicaoItem>) => {
    setMedicao((arr) => arr.map((it, idx) => {
      if (idx !== i) return it
      const novo = { ...it, ...patch }
      if (patch.qtd !== undefined || patch.valorUnit !== undefined) {
        novo.valorTotal = calcularTotalLinha(novo.qtd, novo.valorUnit)
      }
      return novo
    }))
  }
  const addMedicao = () => setMedicao((arr) => [...arr, { descricao: '', qtd: '', valorUnit: '', valorTotal: 0 }])
  const rmMedicao = (i: number) => setMedicao((arr) => arr.filter((_, idx) => idx !== i))
  const totalMedicao = medicao.reduce((s, it) => s + (parseFloat(String(it.valorTotal)) || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!os) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/m/operacoes')} className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="text-center py-12">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
          <div className="text-red-600 text-sm">{erro}</div>
        </div>
      </div>
    )
  }

  const tituloPrincipal = isMunck
    ? (os.servicoTipos || []).map((s: string) => SERVICO_MUNCK_LABEL[s] || s).join(' · ')
    : TIPO_MOV_POLI[os.tipoMovimento] || os.tipoMovimento

  const concluida = os.status === 'CONCLUIDA' || os.status === 'CANCELADA'
  const podeIniciar = os.status === 'RASCUNHO'
  const podeConcluir = os.status === 'EM_ANDAMENTO'

  return (
    <div className="space-y-4">
      {/* Topo (replicando padrão da OS impressa) */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/m/operacoes')} className="flex items-center gap-1 text-sm text-gray-500 active:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="ml-auto flex items-center gap-2">
          {salvando && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" /> salvando
            </div>
          )}
          {!salvando && lastSaveRef.current && (
            <div className="text-xs text-green-600">✓ salvo</div>
          )}
        </div>
      </div>

      {/* Badge laranja com "ORDEM DE SERVIÇO Nº" */}
      <div
        className="rounded-2xl px-5 py-3 flex items-center justify-between"
        style={{ background: '#FFAF06' }}
      >
        <div className="font-bold text-gray-900 text-base">ORDEM DE SERVIÇO</div>
        <div className="text-sm">
          <span className="text-gray-800 mr-2">Nº</span>
          <span className="font-bold text-gray-900 text-base">{os.numero}</span>
        </div>
      </div>

      {/* ────────── 01 DADOS DO SERVIÇO ────────── */}
      <Secao num="01" titulo="Dados do serviço">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Data">
            <input
              type="text"
              value={os.dtHora ? new Date(os.dtHora).toLocaleDateString('pt-BR') : ''}
              disabled
              className={inputCls + ' opacity-60'}
              style={inputStyle}
            />
          </Campo>
          <Campo label="Nº Orç. / Contrato">
            <input
              type="text"
              value={os.contrato?.numero || '—'}
              disabled
              className={inputCls + ' opacity-60'}
              style={inputStyle}
            />
          </Campo>
          <Campo label="Hora início">
            <input
              type="time"
              value={form.hInicio}
              onChange={(e) => setForm({ ...form, hInicio: e.target.value })}
              disabled={!podeEditar}
              className={inputCls}
              style={inputStyle}
            />
          </Campo>
          <Campo label="Hora término">
            <input
              type="time"
              value={form.hTermino}
              onChange={(e) => setForm({ ...form, hTermino: e.target.value })}
              disabled={!podeEditar}
              className={inputCls}
              style={inputStyle}
            />
          </Campo>
        </div>
      </Secao>

      {/* ────────── 02 DADOS DO CLIENTE ────────── */}
      <Secao num="02" titulo="Dados do cliente">
        <Campo label="Cliente / Razão social">
          <input type="text" value={os.cliente?.razaoSocial || ''} disabled className={inputCls + ' opacity-60'} style={inputStyle} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Contato">
            <input type="text" value={os.contatoNome || ''} disabled className={inputCls + ' opacity-60'} style={inputStyle} />
          </Campo>
          <Campo label="Telefone">
            <input type="text" value={os.contatoTelefone || ''} disabled className={inputCls + ' opacity-60'} style={inputStyle} />
          </Campo>
        </div>
        <Campo label="Obra / Setor">
          <input
            type="text"
            value={form.obraSetor}
            onChange={(e) => setForm({ ...form, obraSetor: e.target.value })}
            disabled={!podeEditar}
            placeholder="Ex: Obra Recife Centro · Setor de Manutenção"
            className={inputCls}
            style={inputStyle}
          />
        </Campo>
        <Campo label="Endereço do serviço">
          <input type="text" value={os.endereco || ''} disabled className={inputCls + ' opacity-60'} style={inputStyle} />
        </Campo>
      </Secao>

      {/* ────────── 03 EQUIPAMENTO E EQUIPE ────────── */}
      {isMunck && (
        <Secao num="03" titulo="Equipamento e equipe">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Veículo / Placa">
              <input type="text" value={os.placa || os.caminhao?.placa || ''} disabled className={inputCls + ' opacity-60'} style={inputStyle} />
            </Campo>
            <Campo label="Capacidade (ton)">
              <input type="text" value={os.capacidadeTon || ''} disabled className={inputCls + ' opacity-60'} style={inputStyle} />
            </Campo>
          </div>
          <Campo label="Lança / Alcance (m)">
            <input type="text" value={os.lancaAlcanceM || ''} disabled className={inputCls + ' opacity-60'} style={inputStyle} />
          </Campo>
          <Campo label="Auxiliar / Rigger">
            <input type="text" value={os.auxiliarRigger || ''} disabled className={inputCls + ' opacity-60'} style={inputStyle} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="KM inicial">
              <input
                type="number"
                inputMode="numeric"
                value={form.kmInicial}
                onChange={(e) => setForm({ ...form, kmInicial: e.target.value })}
                disabled={!podeEditar}
                className={inputCls}
                style={inputStyle}
                placeholder="0"
              />
            </Campo>
            <Campo label="KM final">
              <input
                type="number"
                inputMode="numeric"
                value={form.kmFinal}
                onChange={(e) => setForm({ ...form, kmFinal: e.target.value })}
                disabled={!podeEditar}
                className={inputCls}
                style={inputStyle}
                placeholder="0"
              />
            </Campo>
          </div>
          {form.kmInicial && form.kmFinal && (
            <div className="text-xs text-gray-500 px-1">
              KM rodado: <span className="font-medium text-gray-900">
                {Math.max(0, (parseInt(form.kmFinal, 10) || 0) - (parseInt(form.kmInicial, 10) || 0))} km
              </span>
            </div>
          )}
        </Secao>
      )}

      {/* ────────── 04 DESCRIÇÃO DO SERVIÇO EXECUTADO ────────── */}
      <Secao num="04" titulo="Descrição do serviço executado">
        <textarea
          value={form.descricaoOperacional}
          onChange={(e) => setForm({ ...form, descricaoOperacional: e.target.value })}
          rows={4}
          disabled={!podeEditar}
          placeholder="Descreva o que foi feito, dificuldades, materiais utilizados…"
          className={inputCls + ' resize-none'}
          style={inputStyle}
        />
      </Secao>

      {/* ────────── 05 MEDIÇÃO (só Munck) ────────── */}
      {isMunck && (
        <Secao num="05" titulo="Medição">
          {medicao.length === 0 && (
            <div className="text-xs text-gray-400 text-center py-2">Sem itens. Adicione abaixo.</div>
          )}
          <div className="space-y-2">
            {medicao.map((it, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: '#FAF9F6', border: '1px solid #E0DDD8' }}>
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    value={it.descricao}
                    onChange={(e) => atualizarMedicao(i, { descricao: e.target.value })}
                    disabled={!podeEditar}
                    placeholder="Descrição"
                    className="flex-1 px-2 py-2 bg-white rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => rmMedicao(i)}
                    disabled={!podeEditar}
                    className="p-2 rounded-lg active:bg-red-50 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <input
                    type="number" step="0.01"
                    value={it.qtd}
                    onChange={(e) => atualizarMedicao(i, { qtd: e.target.value })}
                    disabled={!podeEditar}
                    placeholder="Qtd"
                    className="px-2 py-2 bg-white rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                  <input
                    type="number" step="0.01"
                    value={it.valorUnit}
                    onChange={(e) => atualizarMedicao(i, { valorUnit: e.target.value })}
                    disabled={!podeEditar}
                    placeholder="V. Unit"
                    className="px-2 py-2 bg-white rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={Number(it.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    disabled
                    className="px-2 py-2 bg-gray-50 rounded-lg text-sm outline-none text-right font-medium"
                    style={inputStyle}
                  />
                </div>
              </div>
            ))}
          </div>
          {podeEditar && (
            <button
              type="button"
              onClick={addMedicao}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white active:bg-gray-50"
              style={{ border: '1px dashed #E0DDD8' }}
            >
              <Plus className="w-4 h-4" /> Adicionar item
            </button>
          )}
          <div
            className="flex items-center justify-between mt-2 px-3 py-2 rounded-lg"
            style={{ background: '#FFF8E6', border: '1px solid #FFD577' }}
          >
            <span className="text-sm font-bold text-gray-900">TOTAL</span>
            <span className="text-base font-bold text-gray-900">{fmtMoney(totalMedicao)}</span>
          </div>
        </Secao>
      )}

      {/* ────────── 06 CONFIRMAÇÃO E ASSINATURAS ────────── */}
      <Secao num="06" titulo="Confirmação e assinaturas">
        <Campo label="Nome legível (cliente)">
          <input
            type="text"
            value={form.respNome}
            onChange={(e) => setForm({ ...form, respNome: e.target.value })}
            disabled={!podeEditar}
            placeholder="Nome de quem recebeu / responsável no local"
            className={inputCls}
            style={inputStyle}
          />
        </Campo>
        <Campo label="Ocorrências (opcional)">
          <textarea
            value={form.ocorrencias}
            onChange={(e) => setForm({ ...form, ocorrencias: e.target.value })}
            rows={3}
            disabled={!podeEditar}
            placeholder="Imprevistos, atrasos, problemas no local…"
            className={inputCls + ' resize-none'}
            style={inputStyle}
          />
        </Campo>
      </Secao>

      {/* ────────── FOTOS ────────── */}
      <Secao num="📷" titulo="Fotos da execução">
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              {podeEditar && (
                <button
                  onClick={() => setFotos((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                  aria-label="Remover"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>
          ))}
          {podeEditar && (
            <label
              className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer bg-white active:bg-gray-50"
              style={{ borderColor: '#E0DDD8' }}
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-gray-400" />
              )}
              <span className="text-[10px] text-gray-500 mt-1">Adicionar</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) adicionarFoto(f)
                  e.target.value = ''
                }}
              />
            </label>
          )}
        </div>
      </Secao>

      {erro && (
        <div className="text-red-600 text-sm text-center">{erro}</div>
      )}

      {/* Ações */}
      {concluida ? (
        <div
          className="rounded-2xl border p-5 text-center"
          style={{ background: '#E8F5E9', borderColor: '#C8E6C9' }}
        >
          <Check className="w-10 h-10 mx-auto mb-2 text-green-600" />
          <div className="font-medium text-green-900">OS concluída</div>
          {os.hTermino && (
            <div className="text-xs text-green-800 mt-1">Término registrado às {os.hTermino}</div>
          )}
        </div>
      ) : (
        <div className="sticky bottom-3 space-y-2">
          {podeIniciar && (
            <button
              onClick={iniciar}
              className="w-full py-3.5 rounded-xl bg-white border-2 flex items-center justify-center gap-2 font-medium text-gray-900 active:bg-gray-50 shadow-lg"
              style={{ borderColor: '#FFAF06' }}
            >
              <Play className="w-4 h-4" />
              Iniciar OS
            </button>
          )}
          {podeConcluir && (
            <button
              onClick={finalizar}
              disabled={salvandoFinalizar}
              className="w-full py-4 rounded-xl font-semibold text-gray-900 disabled:opacity-50 active:opacity-80 shadow-lg"
              style={{ background: '#FFAF06' }}
            >
              {salvandoFinalizar ? 'Concluindo…' : 'Concluir OS'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
