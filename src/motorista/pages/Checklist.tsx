import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthMotorista } from '../AuthMotoristaContext'
import apiMotorista from '../api'
import { Camera, Check, X, Loader2 } from 'lucide-react'

const ITENS_CHECKLIST = [
  { id: 'pneus', label: 'Pneus em bom estado' },
  { id: 'oleo', label: 'Nível de óleo OK' },
  { id: 'freios', label: 'Freios funcionando' },
  { id: 'farois', label: 'Faróis e lanternas' },
  { id: 'limpadores', label: 'Limpadores de para-brisa' },
  { id: 'combustivel', label: 'Combustível suficiente' },
  { id: 'documentacao', label: 'Documentação a bordo' },
  { id: 'kit_emergencia', label: 'Kit emergência (triângulo/extintor)' },
] as const

const LADOS = [
  { id: 'fotoFrente', label: 'Frente' },
  { id: 'fotoTras', label: 'Traseira' },
  { id: 'fotoLatEsq', label: 'Lateral esquerda' },
  { id: 'fotoLatDir', label: 'Lateral direita' },
] as const

type ItemStatusValor = 'OK' | 'AVARIADO'
interface ItemEstado {
  status: ItemStatusValor
  descricao?: string
}

async function comprimirImagem(file: File, maxLado = 1024, qualidade = 0.7): Promise<Blob> {
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

export default function MotoristaChecklist() {
  const { caminhao } = useAuthMotorista()
  const navigate = useNavigate()
  const [fotos, setFotos] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [itens, setItens] = useState<Record<string, ItemEstado>>({})
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const escolherFoto = async (ladoId: string, file: File) => {
    setUploading(ladoId)
    setErro('')
    try {
      const blob = await comprimirImagem(file)
      const form = new FormData()
      form.append('file', blob, `${ladoId}.jpg`)
      const { data } = await apiMotorista.post('/motorista-app/upload/checklist', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFotos((prev) => ({ ...prev, [ladoId]: data.url }))
    } catch (e: any) {
      setErro('Falha ao enviar foto: ' + (e?.response?.data?.message || e.message))
    } finally {
      setUploading(null)
    }
  }

  const salvar = async () => {
    if (!caminhao) return
    setErro('')
    // Valida: precisa de pelo menos 1 foto e todos os itens marcados
    const todosItensRespondidos = ITENS_CHECKLIST.every((i) => itens[i.id]?.status)
    if (!todosItensRespondidos) {
      setErro('Marque todos os itens da lista')
      return
    }
    setSalvando(true)
    try {
      // Captura geo se disponível
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
      await apiMotorista.post('/motorista-app/checklist', {
        caminhaoId: caminhao.id,
        ...fotos,
        itens,
        observacoes: observacoes || null,
        ...geo,
      })
      navigate('/m/operacoes')
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Falha ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Check-list do veículo</h1>

      {/* Fotos */}
      <section>
        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Fotos</div>
        <div className="grid grid-cols-2 gap-3">
          {LADOS.map((lado) => {
            const url = fotos[lado.id]
            const carregando = uploading === lado.id
            return (
              <label
                key={lado.id}
                className="relative aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white active:bg-gray-50"
                style={{ borderColor: url ? '#C8E6C9' : '#E0DDD8' }}
              >
                {url ? (
                  <>
                    <img src={url} alt={lado.label} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                      {lado.label}
                    </div>
                  </>
                ) : (
                  <>
                    {carregando ? (
                      <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
                    ) : (
                      <Camera className="w-7 h-7 text-gray-400" />
                    )}
                    <div className="text-xs text-gray-600 mt-1.5 font-medium">{lado.label}</div>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) escolherFoto(lado.id, f)
                    e.target.value = ''
                  }}
                />
              </label>
            )
          })}
        </div>
      </section>

      {/* Itens em conformidade */}
      <section>
        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
          Conformidade dos itens
        </div>
        <div className="space-y-2">
          {ITENS_CHECKLIST.map((item) => {
            const estado = itens[item.id]
            const status = estado?.status
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border p-3"
                style={{ borderColor: '#E0DDD8' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-sm text-gray-900">{item.label}</div>
                  <button
                    type="button"
                    onClick={() => setItens((p) => ({ ...p, [item.id]: { status: 'OK' } }))}
                    className="w-10 h-10 rounded-lg flex items-center justify-center active:scale-95 transition"
                    style={{
                      background: status === 'OK' ? '#2D7D32' : '#F5F5F5',
                      color: status === 'OK' ? '#FFFFFF' : '#999',
                    }}
                    aria-label="OK"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItens((p) => ({
                      ...p,
                      [item.id]: { status: 'AVARIADO', descricao: p[item.id]?.descricao || '' },
                    }))}
                    className="w-10 h-10 rounded-lg flex items-center justify-center active:scale-95 transition"
                    style={{
                      background: status === 'AVARIADO' ? '#C62828' : '#F5F5F5',
                      color: status === 'AVARIADO' ? '#FFFFFF' : '#999',
                    }}
                    aria-label="Avariado"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {status === 'AVARIADO' && (
                  <input
                    type="text"
                    value={estado?.descricao || ''}
                    onChange={(e) => setItens((p) => ({
                      ...p,
                      [item.id]: { status: 'AVARIADO', descricao: e.target.value },
                    }))}
                    placeholder="Descreva o problema (opcional)"
                    className="w-full mt-2 px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #E0DDD8' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Observações */}
      <section>
        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
          Observações <span className="text-gray-400 normal-case">(opcional)</span>
        </div>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          placeholder="Avarias específicas, manutenções pendentes, etc."
          className="w-full px-4 py-3 bg-white rounded-xl text-sm outline-none resize-none"
          style={{ border: '1px solid #E0DDD8' }}
        />
      </section>

      {erro && (
        <div className="text-red-600 text-sm text-center">{erro}</div>
      )}

      <button
        onClick={salvar}
        disabled={salvando}
        className="w-full py-4 rounded-xl font-semibold text-gray-900 disabled:opacity-50 active:opacity-80"
        style={{ background: '#FFAF06' }}
      >
        {salvando ? 'Salvando…' : 'Finalizar check-list'}
      </button>
    </div>
  )
}
