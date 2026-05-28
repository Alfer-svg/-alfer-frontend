import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiMotorista from '../api'
import { Camera, Check, Loader2, MapPin, Clock, Play, Trash2 } from 'lucide-react'

const TIPO_LABEL: Record<string, string> = {
  ENTREGA: 'Entrega',
  RETIRADA: 'Retirada',
  TROCA: 'Troca',
  SERVICO_AVULSO: 'Serviço avulso',
  MOBILIZACAO: 'Mobilização',
  DESMOBILIZACAO: 'Desmobilização',
  MANUTENCAO: 'Manutenção',
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

export default function MotoristaOperacaoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [op, setOp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fotos, setFotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [respNome, setRespNome] = useState('')
  const [respCpf, setRespCpf] = useState('')
  const [respCargo, setRespCargo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    // O endpoint atual lista operações do dia. Pega só essa do array.
    apiMotorista.get('/motorista-app/me/operacoes-hoje')
      .then((r) => {
        const found = r.data.find((x: any) => x.id === id)
        if (found) setOp(found)
        else setErro('Operação não encontrada na fila de hoje')
      })
      .finally(() => setLoading(false))
  }, [id])

  const iniciar = async () => {
    if (!id) return
    try {
      await apiMotorista.post(`/motorista-app/operacoes/${id}/iniciar`)
      setOp({ ...op, status: 'EM_ROTA' })
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Falha ao iniciar')
    }
  }

  const adicionarFoto = async (file: File) => {
    setUploading(true)
    setErro('')
    try {
      const blob = await comprimirImagem(file)
      const form = new FormData()
      form.append('file', blob, `${Date.now()}.jpg`)
      const { data } = await apiMotorista.post('/motorista-app/upload/operacao', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFotos((prev) => [...prev, data.url])
    } catch (e: any) {
      setErro('Falha ao enviar foto: ' + (e?.response?.data?.message || e.message))
    } finally {
      setUploading(false)
    }
  }

  const removerFoto = (i: number) => setFotos((prev) => prev.filter((_, idx) => idx !== i))

  const finalizar = async () => {
    if (!id) return
    if (fotos.length === 0) {
      setErro('Adicione ao menos uma foto da operação')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      let geo: { geoLat?: number; geoLng?: number } = {}
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { geo.geoLat = pos.coords.latitude; geo.geoLng = pos.coords.longitude; resolve() },
            () => resolve(),
            { timeout: 3000 },
          )
        })
      }
      await apiMotorista.post(`/motorista-app/operacoes/${id}/registrar`, {
        fotosUrls: fotos,
        respNome: respNome || null,
        respCpf: respCpf || null,
        respCargo: respCargo || null,
        checklistOk: true,
        ...geo,
      })
      navigate('/m/operacoes')
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Falha ao finalizar')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!op) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-sm">{erro}</div>
        <button
          onClick={() => navigate('/m/operacoes')}
          className="mt-4 px-4 py-2 rounded-lg text-sm bg-white border"
          style={{ borderColor: '#E0DDD8' }}
        >
          Voltar
        </button>
      </div>
    )
  }

  // Só permite finalizar se já estiver em rota — força o fluxo
  // AGENDADA → EM_ROTA → CONCLUIDA pra sincronizar com a Logística
  const podeFinalizar = op.status === 'EM_ROTA'

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/m/operacoes')}
        className="text-sm text-gray-500 active:text-gray-900"
      >
        ← Voltar
      </button>

      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E0DDD8' }}>
        <div className="font-bold text-lg text-gray-900">
          {TIPO_LABEL[op.tipo] || op.tipo}
        </div>
        {op.clienteNome && (
          <div className="text-sm text-gray-700 mt-1">{op.clienteNome}</div>
        )}
        <div className="space-y-1.5 mt-3 text-sm">
          {op.horaAgendada && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{op.horaAgendada}</span>
            </div>
          )}
          {op.endDestino && (
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>{op.endDestino}</span>
            </div>
          )}
          {op.tipo === 'TROCA' && op.equipamentoNovo?.codigo ? (
            <div className="mt-3 p-3 rounded-xl space-y-2" style={{ background: '#FEF3E2', border: '1px solid #FFAF06' }}>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-700">Troca de caçamba</div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">RETIRA</span>
                  <span className="font-bold text-gray-900">{op.equipamento?.codigo}</span>
                </div>
                <span className="text-2xl text-gray-400">→</span>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500">DEIXA</span>
                  <span className="font-bold text-gray-900">{op.equipamentoNovo.codigo}</span>
                </div>
              </div>
            </div>
          ) : (
            op.equipamento?.codigo && (
              <div className="text-xs text-gray-500 mt-2">
                Equipamento: <span className="font-medium text-gray-700">{op.equipamento.codigo}</span>
              </div>
            )
          )}
        </div>
        {op.observacoes && (
          <div className="mt-3 pt-3 border-t text-xs text-gray-600" style={{ borderColor: '#F1EFE8' }}>
            {op.observacoes}
          </div>
        )}
      </div>

      {op.status === 'CONCLUIDA' ? (
        <div
          className="rounded-2xl border p-5 text-center"
          style={{ background: '#E8F5E9', borderColor: '#C8E6C9' }}
        >
          <Check className="w-10 h-10 mx-auto mb-2 text-green-600" />
          <div className="font-medium text-green-900">Operação concluída</div>
          {op.dtConclusao && (
            <div className="text-xs text-green-800 mt-1">
              {new Date(op.dtConclusao).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      ) : (
        <>
          {op.status === 'AGENDADA' && (
            <button
              onClick={iniciar}
              className="w-full py-3 rounded-xl bg-white border-2 flex items-center justify-center gap-2 font-medium text-gray-900 active:bg-gray-50"
              style={{ borderColor: '#FFAF06' }}
            >
              <Play className="w-4 h-4" />
              Iniciar operação
            </button>
          )}

          {/* Fotos da operação */}
          <section>
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Fotos da execução
            </div>
            <div className="grid grid-cols-3 gap-2">
              {fotos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removerFoto(i)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                    aria-label="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer bg-white active:bg-gray-50"
                style={{ borderColor: '#E0DDD8' }}>
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
            </div>
          </section>

          {/* Responsável que recebeu */}
          <section className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Responsável no local <span className="text-gray-400 normal-case">(opcional)</span>
            </div>
            <input
              type="text"
              value={respNome}
              onChange={(e) => setRespNome(e.target.value)}
              placeholder="Nome"
              className="w-full px-4 py-3 bg-white rounded-xl text-sm outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
            <input
              type="text"
              inputMode="numeric"
              value={respCpf}
              onChange={(e) => setRespCpf(e.target.value)}
              placeholder="CPF"
              className="w-full px-4 py-3 bg-white rounded-xl text-sm outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
            <input
              type="text"
              value={respCargo}
              onChange={(e) => setRespCargo(e.target.value)}
              placeholder="Cargo / função"
              className="w-full px-4 py-3 bg-white rounded-xl text-sm outline-none"
              style={{ border: '1px solid #E0DDD8' }}
            />
          </section>

          {erro && (
            <div className="text-red-600 text-sm text-center">{erro}</div>
          )}

          {podeFinalizar && (
            <button
              onClick={finalizar}
              disabled={salvando}
              className="w-full py-4 rounded-xl font-semibold text-gray-900 disabled:opacity-50 active:opacity-80"
              style={{ background: '#FFAF06' }}
            >
              {salvando ? 'Finalizando…' : 'Finalizar operação'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
